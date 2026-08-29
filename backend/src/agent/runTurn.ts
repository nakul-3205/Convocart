import { compiledGraph } from './graph';
import { AgentTurnOutput, type AgentTurnOutputType } from './schema';

import { logger } from '../utils/logger';
import { env } from '../config/env';

const TIMEOUT_MS = 100_000 ;

const MAX_RETRIES = 2;

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return true;
  }

  const message = error.message.toLowerCase();

  // Timeout / abort
  if (message.includes('abort') || message.includes('timeout') || message.includes('timed out')) {
    return true;
  }

  // Rate limits
  if (message.includes('429') || message.includes('rate limit') || message.includes('quota')) {
    return true;
  }

  // Temporary server/network errors
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('socket')
  ) {
    return true;
  }

  return false;
}

function createTimeout(controller: AbortController, sessionId: string, attempt: number) {
  return setTimeout(() => {
    logger.warn(
      {
        sessionId,
        attempt,
        timeoutMs: TIMEOUT_MS,
      },
      'Agent turn timeout reached, aborting graph',
    );

    controller.abort();
  }, TIMEOUT_MS);
}

export async function runAgentTurn(
  sessionId: string,
  message: string,
): Promise<AgentTurnOutputType> {
  let lastErr: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();

    const timeoutHandle = createTimeout(controller, sessionId, attempt);

    const startedAt = Date.now();

    try {
      logger.info(
        {
          sessionId,
          attempt,
          provider: env.MODEL_PROVIDER,
          model: env.MODEL_NAME,
        },
        'Starting agent turn',
      );

      const result = await compiledGraph.invoke(
        {
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
          sessionId,
        },
        {
          configurable: {
            thread_id: sessionId,
          },

          signal: controller.signal,
        },
      );
      logger.info({result},'Agent output')
      const validated = AgentTurnOutput.safeParse(result.structuredOutput);
      logger.info({validated},'Agent output validated one')

      if (!validated.success) {
        throw new Error(`Agent returned invalid structured output: ${validated.error.message}`);
      }

      logger.info(
        {
          sessionId,
          attempt,
          elapsedMs: Date.now() - startedAt,
        },
        'Agent turn completed successfully',
      );

      return validated.data;
    } catch (error) {
      lastErr = error;

      const elapsedMs = Date.now() - startedAt;

      const wasAborted = controller.signal.aborted;

      const retryable = isRetryableError(error);

      logger.warn(
        {
          err: error,
          sessionId,
          attempt,
          elapsedMs,
          wasAborted,
          retryable,
        },
        'Agent turn failed',
      );

      if (attempt < MAX_RETRIES && retryable) {
        const delayMs = 500 * 2 ** attempt;

        logger.info(
          {
            sessionId,
            attempt,
            retryInMs: delayMs,
          },
          'Retrying agent turn',
        );

        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      } else {
        break;
      }
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  logger.error(
    {
      err: lastErr,
      sessionId,
      provider: env.MODEL_PROVIDER,
      model: env.MODEL_NAME,
    },
    'Agent turn failed after all retries',
  );

  return {
    reply: "Sorry, I'm having trouble right now — mind trying that again in a moment?",

    recommendedProductIds: [],

    upsellProductId: null,

    upsellReason: null,

    needsClarification: false,
  };
}
