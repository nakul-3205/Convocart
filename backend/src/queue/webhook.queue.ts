import { Queue } from 'bullmq';
import { redis } from '../db/redis';

export const webhookQueue = new Queue('webhook-events', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 500 },
  },
});