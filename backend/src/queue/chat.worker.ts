import { Worker } from 'bullmq';
import { redis } from '../db/redis';
import { runAgentTurn } from '../agent/runTurn';

export const chatWorker = new Worker(
  'chat-turns',
  async (job) => runAgentTurn(job.data.sessionId, job.data.message),
  {
    connection: redis,
    concurrency: 1,
  },
);
