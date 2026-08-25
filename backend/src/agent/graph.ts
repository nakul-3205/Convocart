import {
  StateGraph,
  MessagesAnnotation,
  Annotation,
  MemorySaver,
  START,
  END,
} from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { searchProductsTool } from './tools';
import { buildSystemPrompt } from './prompts/system.prompt';
import { AgentTurnOutput, type AgentTurnOutputType } from './schema';
import { env } from '../config/env';
import { checkpointer } from './checkpointer';
import { getUpsellCandidate } from '../services/upsell.services';
import { getCartSummary } from '../services/cart.services';

const tools = [searchProductsTool];
const systemPrompt = buildSystemPrompt({ storeName: 'Convocart', category: 'shoe' });

const reactModel = new ChatGoogleGenerativeAI({
  model: 'gemini-3.5-flash',
  apiKey: env.GEMINI_API_KEY,
}).bindTools(tools);

const structuredModel = new ChatGoogleGenerativeAI({
  model: 'gemini-3.5-flash',
  apiKey: env.GEMINI_API_KEY,
}).withStructuredOutput(AgentTurnOutput);

const ConvocartState = Annotation.Root({
  ...MessagesAnnotation.spec,
  sessionId: Annotation<string>(),
  structuredOutput: Annotation<AgentTurnOutputType | null>({
    reducer: (_p, n) => n,
    default: () => null,
  }),
});

async function agentNode(state: typeof ConvocartState.State) {
  const response = await reactModel.invoke([
    { role: 'system', content: systemPrompt },
    ...state.messages,
  ]);
  return { messages: [response] };
}

function shouldContinue(state: typeof ConvocartState.State) {
  const last = state.messages[state.messages.length - 1] as any;
  return last.tool_calls?.length ? 'tools' : 'finalize';
}

async function finalizeNode(state: typeof ConvocartState.State) {
  const cart = await getCartSummary(state.sessionId);
  const cartProductIds = cart.items.map((i) => i.productId);
  const candidate = await getUpsellCandidate(cartProductIds);

  const candidateInstruction = candidate
    ? `You may suggest exactly this one upsell if it fits naturally: ${candidate.name} (₹${candidate.price}). Set upsellProductId to "${candidate.productId}" only if you choose to suggest it, otherwise null.`
    : `No upsell candidate is available this turn. upsellProductId MUST be null.`;

  const structured = await structuredModel.invoke([
    { role: 'system', content: systemPrompt },
    ...state.messages,
    {
      role: 'user',
      content: `${candidateInstruction}\nProduce your final structured response for this turn now.`,
    },
  ]);

  
  if (structured.upsellProductId && structured.upsellProductId !== candidate?.productId) {
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
