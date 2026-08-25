import { Worker } from 'bullmq';
import { redis } from '../db/redis';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { releaseOrderStock } from '../services/stockrelease.service';
import { sendOrderConfirmation } from '../services/email.services';

export const webhookWorker = new Worker(
  'webhook-events',
  async (job) => {
    const event = job.data;
    const eventId = event.event + ':' + (event.payload?.payment?.entity?.id ?? job.id);

    const already = await prisma.processedWebhookEvent.findUnique({ where: { razorpayEventId: eventId } });
    if (already) {
      logger.info({ eventId }, 'Webhook already processed, skipping');
      return;
    }

    const razorpayOrderId = event.payload?.payment?.entity?.order_id;
    if (!razorpayOrderId) return;

    const order = await prisma.order.findUnique({ where: { razorpayOrderId } });
    if (!order) {
      logger.warn({ razorpayOrderId }, 'Webhook for unknown order');
      return;
    }

    if (event.event === 'payment.captured') {
      await prisma.$transaction([
        prisma.order.update({ where: { id: order.id }, data: { status: 'paid', reservedUntil: null } }),
        prisma.auditLog.create({
          data: { orderId: order.id, eventType: 'payment_captured', reasonText: 'Payment confirmed via webhook' },
        }),
      ]);
      await sendOrderConfirmation(order.email, order.id, order.trackingToken, order.total);
      logger.info({ orderId: order.id }, 'Order marked paid, confirmation sent');
    }

    if (event.event === 'payment.failed') {
      await releaseOrderStock(order.id); // Step 8
      await prisma.$transaction([
        prisma.order.update({ where: { id: order.id }, data: { status: 'failed', reservedUntil: null } }),
        prisma.auditLog.create({
          data: { orderId: order.id, eventType: 'payment_failed', reasonText: 'Payment declined — stock released' },
        }),
      ]);
      logger.info({ orderId: order.id }, 'Order failed, stock released');
    }

    await prisma.processedWebhookEvent.create({ data: { razorpayEventId: eventId } });
  },
  { connection: redis },
);

webhookWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Webhook job failed after retries');
});