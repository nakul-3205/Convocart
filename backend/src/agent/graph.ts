import { StateGraph, MessagesAnnotation, Annotation, START, END } from '@langchain/langgraph';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOllama } from '@langchain/ollama';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { trimMessages } from '@langchain/core/messages';

import { searchProductsTool, addToCartTool } from './tools';
import { buildSystemPrompt } from './prompts/system.prompt';
import { AgentTurnOutput, type AgentTurnOutputType } from './schema';
import { checkpointer } from './checkpointer';

import { env } from '../config/env';
import { getUpsellCandidate } from '../services/upsell.services';
import { getCartSummary } from '../services/cart.services';
import { prisma } from '../db/prisma';

function requireEnvValue(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`${key} is required when MODEL_PROVIDER="${env.MODEL_PROVIDER}"`);
  }
  return value;
}

function createBaseModel(): any {
  switch (env.MODEL_PROVIDER) {
    case 'anthropic': {
      return new ChatAnthropic({
        apiKey: requireEnvValue(env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY'),
        model: env.MODEL_NAME,
      });
    }
    case 'ollama': {
      return new ChatOllama({
        baseUrl: env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
        model: env.MODEL_NAME,
      });
    }
    case 'openrouter': {
      return new ChatOpenAI({
        apiKey: requireEnvValue(env.OPENROUTER_API_KEY, 'OPENROUTER_API_KEY'),
        model: env.MODEL_NAME,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: { 'X-Title': 'Convocart' },
        },
        modelKwargs: {
          provider: { sort: 'throughput', allow_fallbacks: true },
        },
      });
    }
    case 'groq': {
      return new ChatGroq({
        apiKey: requireEnvValue(env.GROQ_API_KEY, 'GROQ_API_KEY'),
        model: env.MODEL_NAME,
      });
    }
    case 'openai': {
      return new ChatOpenAI({
        apiKey: requireEnvValue(env.OPENAI_API_KEY, 'OPENAI_API_KEY'),
        model: env.MODEL_NAME,
      });
    }
    case 'gemini': {
      return new ChatGoogleGenerativeAI({
        apiKey: requireEnvValue(env.GEMINI_API_KEY, 'GEMINI_API_KEY'),
        model: env.MODEL_NAME,
      });
    }
    default:
      throw new Error(`Unsupported MODEL_PROVIDER: ${env.MODEL_PROVIDER}`);
  }
}

const tools = [searchProductsTool, addToCartTool];

const systemPrompt = buildSystemPrompt({ storeName: 'Convocart', category: 'shoe' });

const ConvocartState = Annotation.Root({
  ...MessagesAnnotation.spec,
  sessionId: Annotation<string>(),
  structuredOutput: Annotation<AgentTurnOutputType | null>({
    reducer: (_previous, next) => next,
    default: () => null,
  }),
});

const baseModel = createBaseModel();
const reactModel = baseModel.bindTools(tools, { tool_choice: 'auto' });
const structuredModel = createBaseModel().withStructuredOutput(AgentTurnOutput);

async function getTrimmedMessages(messages: typeof ConvocartState.State.messages) {
  return trimMessages(messages, {
    maxTokens: 2500,
    strategy: 'last',
    tokenCounter: (msgs) =>
      msgs.reduce(
        (sum, message) =>
          sum + (typeof message.content === 'string' ? message.content.length / 4 : 100),
        0,
      ),
    startOn: 'human',
  });
}

export function normalizeMessageContent(messages: any[]): any[] {
  return messages.map((message) => {
    let content = message.content;
    if (Array.isArray(content)) {
      content = content
        .map((part: any) => (typeof part === 'string' ? part : (part?.text ?? '')))
        .filter(Boolean)
        .join(' ');
    } else if (content == null) {
      content = '';
    }
    return Object.assign(Object.create(Object.getPrototypeOf(message)), message, { content });
  });
}

export function toSafeMessages(
  messages: any[],
): { role: 'user' | 'assistant' | 'system'; content: string }[] {
  return messages.map((message) => {
    const type = typeof message._getType === 'function' ? message._getType() : message.role;

    if (type === 'tool') {
      const raw =
        typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
      return {
        role: 'user' as const,
        content: `[Tool result from ${message.name ?? 'a tool'}]: ${raw}`,
      };
    }

    const role: 'user' | 'assistant' | 'system' =
      type === 'human' ? 'user' : type === 'system' ? 'system' : 'assistant';
    let content = '';
    if (typeof message.content === 'string') {
      content = message.content;
    } else if (Array.isArray(message.content)) {
      content = message.content
        .map((part: any) => (typeof part === 'string' ? part : (part?.text ?? '')))
        .filter(Boolean)
        .join(' ');
    }
    return { role, content: content.trim() || '(no text content)' };
  });
}

async function agentNode(state: typeof ConvocartState.State) {
  const trimmed = await getTrimmedMessages(state.messages);
  const safe = normalizeMessageContent(trimmed);
  const response = await reactModel.invoke([{ role: 'system', content: systemPrompt }, ...safe]);
  return { messages: [response] };
}

function shouldContinue(state: typeof ConvocartState.State) {
  const last = state.messages[state.messages.length - 1] as any;
  return last.tool_calls?.length ? 'tools' : 'finalize';
}

function wasAddToCartCalledThisTurn(messages: any[]): boolean {
  let lastHumanIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const type =
      typeof messages[i]._getType === 'function' ? messages[i]._getType() : messages[i].role;
    if (type === 'human') {
      lastHumanIndex = i;
      break;
    }
  }
  if (lastHumanIndex === -1) return false;
  return messages.slice(lastHumanIndex).some((m) => {
    const type = typeof m._getType === 'function' ? m._getType() : m.role;
    return type === 'tool' && m.name === 'add_to_cart';
  });
}

async function finalizeNode(state: typeof ConvocartState.State) {
  let candidate: Awaited<ReturnType<typeof getUpsellCandidate>> = null;

  // Only touches the DB at all if a cart-add genuinely happened this turn —
  // every other turn (searches, questions, chit-chat) skips this entirely.
  if (wasAddToCartCalledThisTurn(state.messages)) {
    const session = await prisma.session.findUnique({
      where: { id: state.sessionId },
      select: { upsellOfferedOnce: true },
    });

    if (!session?.upsellOfferedOnce) {
      const cart = await getCartSummary(state.sessionId);
      candidate = await getUpsellCandidate(cart.items.map((i) => i.productId));
    }
  }

  const candidateInstruction = candidate
    ? `You must mention this upsell naturally as part of your reply: ${candidate.name} (₹${candidate.price}). Use this reasoning, lightly rephrased to fit your sentence: "${candidate.reason}"`
    : '';

  const trimmed = await getTrimmedMessages(state.messages);
  const safeMessages = toSafeMessages(trimmed);

  const structured = await structuredModel.invoke([
    { role: 'system', content: systemPrompt },
    ...safeMessages,
    {
      role: 'user',
      content: `${candidateInstruction}\nIf you recommended specific products this turn, set recommendedProductIds to their exact "id" values from the most recent search_products result above.\nProduce your final structured response for this turn now.`,
    },
  ]);

  if (candidate) {
    structured.upsellProductId = candidate.productId;
    structured.upsellReason = candidate.reason;

    const marked = await prisma.session.updateMany({
      where: { id: state.sessionId, upsellOfferedOnce: false },
      data: { upsellOfferedOnce: true },
    });

    if (marked.count > 0) {
      await prisma.auditLog.create({
        data: {
          sessionId: state.sessionId,
          eventType: 'upsell_offered',
          reasonText: `Offered ${candidate.name} — ${candidate.reason}`,
        },
      });
    }
  } else {
    structured.upsellProductId = null;
    structured.upsellReason = null;
  }

  return { structuredOutput: structured };
}

const graph = new StateGraph(ConvocartState)
  .addNode('agent', agentNode)
  .addNode('tools', new ToolNode(tools))
  .addNode('finalize', finalizeNode)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue, { tools: 'tools', finalize: 'finalize' })
  .addEdge('tools', 'agent')
  .addEdge('finalize', END);

export const compiledGraph = graph.compile({ checkpointer });
