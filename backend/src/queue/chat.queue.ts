import { Queue, QueueEvents } from 'bullmq';
import { redis } from '../db/redis';

export const chatQueue = new Queue('chat-turns', { connection: redis });
export const chatQueueEvents = new QueueEvents('chat-turns', { connection: redis });