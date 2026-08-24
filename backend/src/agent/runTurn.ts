import { compiledGraph } from './graph';
import { AgentTurnOutput, type AgentTurnOutputType } from './schema';
import { logger } from '../utils/logger';

const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

class AgentTimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new AgentTimeoutError('Agent call timed out')), ms)),
  ]);
}

export async function runAgentTurn(sessionId: string, message: string): Promise<AgentTurnOutputType> {
  let lastErr: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await withTimeout(
        compiledGraph.invoke(
          { messages: [{ role: 'user', content: message }] },
          { configurable: { thread_id: sessionId } },
        ),
        TIMEOUT_MS,
      );

      // Defense in depth: re-validate even though withStructuredOutput should already guarantee shape.
      // Never trust a single layer with something this important.
      const validated = AgentTurnOutput.safeParse(result.structuredOutput);
      if (!validated.success) {
        throw new Error(`Agent returned invalid structured output: ${validated.error.message}`);
      }

      return validated.data;
    } catch (err) {
      lastErr = err;
      logger.warn({ err, attempt, sessionId }, 'Agent turn failed, retrying if attempts remain');
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt)); // exponential backoff
      }
    }
  }

  logger.error({ err: lastErr, sessionId }, 'Agent turn failed after all retries');
  return {
    reply: "Sorry, I'm having trouble right now — mind trying that again in a moment?",
    recommendedProductIds: [],
    upsellProductId: null,
    upsellReason: null,
    needsClarification: false,
  };
}