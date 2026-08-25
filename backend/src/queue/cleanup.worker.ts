import { Queue, Worker } from 'bullmq';
import { redis } from '../db/redis';
import { prisma } from '../db/prisma';
import { releaseOrderStock } from '../services/stockrelease.service';
import { logger } from '../utils/logger';

export const cleanupQueue = new Queue('stock-cleanup', { connection: redis });

export const cleanupWorker = new Worker(
  'stock-cleanup',
  async () => {
    const expired = await prisma.order.findMany({
      where: { status: 'pending', reservedUntil: { lt: new Date() } },
    });

    for (const order of expired) {
      await releaseOrderStock(order.id);
      await prisma.$transaction([
        prisma.order.update({ where: { id: order.id }, data: { status: 'expired', reservedUntil: null } }),
        prisma.auditLog.create({
          data: { orderId: order.id, eventType: 'order_expired', reasonText: 'Checkout abandoned — stock released after TTL' },
        }),
      ]);
      logger.info({ orderId: order.id }, 'Expired order cleaned up, stock released');
    }
  },
  { connection: redis },
);

export async function scheduleCleanupJob() {
  await cleanupQueue.upsertJobScheduler(
    'stock-cleanup-sweep',
    {
      every: 2 * 60 * 1000,
    },
    {
      name: 'sweep',
      data: {},
    },
  );
}