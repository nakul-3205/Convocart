import { StateGraph, MessagesAnnotation, Annotation, MemorySaver, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { searchProductsTool } from './tools';
import { buildSystemPrompt } from './prompts/system.prompt';
import { AgentTurnOutput, type AgentTurnOutputType } from './schema';
import { env } from '../config/env';
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

// Custom state — carries the structured result alongside the message history
const ConvocartState = Annotation.Root({
  ...MessagesAnnotation.spec,
  structuredOutput: Annotation<AgentTurnOutputType | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
});

async function agentNode(state: typeof ConvocartState.State) {
  const response = await reactModel.invoke([{ role: 'system', content: systemPrompt }, ...state.messages]);
  return { messages: [response] };
}

function shouldContinue(state: typeof ConvocartState.State) {
  const last = state.messages[state.messages.length - 1] as any;
  return last.tool_calls?.length ? 'tools' : 'finalize';
}

async function finalizeNode(state: typeof ConvocartState.State) {
  const structured = await structuredModel.invoke([
    { role: 'system', content: systemPrompt },
    ...state.messages,
    { role: 'user', content: 'Produce your final structured response for this turn now.' },
  ]);
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

// MemorySaver for now — swap for the Postgres checkpointer once this path is confirmed working
export const compiledGraph = graph.compile({ checkpointer: new MemorySaver() });