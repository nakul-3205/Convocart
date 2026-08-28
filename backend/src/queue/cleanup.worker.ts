import { Queue, Worker } from 'bullmq';
import { redis } from '../db/redis';
import { prisma } from '../db/prisma';
import { razorpay } from '../services/razorpay.client';
import { releaseOrderStock } from '../services/stockrelease.service';
import { sendOrderConfirmation } from '../services/email.services';
import { logger } from '../utils/logger';

export const cleanupQueue = new Queue('stock-cleanup', { connection: redis });

async function reconcileWithRazorpay(razorpayOrderId: string): Promise<'paid' | 'not_paid'> {
  try {
    const payments = await razorpay.orders.fetchPayments(razorpayOrderId);
    const captured = payments.items?.some((p: any) => p.status === 'captured');
    return captured ? 'paid' : 'not_paid';
  } catch (err) {
    logger.error({ err, razorpayOrderId }, 'Reconciliation check with Razorpay failed — treating as unpaid, logged for manual review');
    return 'not_paid';
  }
}

export const cleanupWorker = new Worker(
  'stock-cleanup',
  async () => {
    const expired = await prisma.order.findMany({
      where: { status: 'pending', reservedUntil: { lt: new Date() } },
      include: { items: { include: { product: true } } },
    });

    for (const order of expired) {
      // Only reconcile if checkout actually reached Razorpay — an order that never
      // got a razorpayOrderId was abandoned before payment even started, nothing to check.
      const status = order.razorpayOrderId ? await reconcileWithRazorpay(order.razorpayOrderId) : 'not_paid';

      if (status === 'paid') {
        // The webhook was missed, but the customer genuinely paid — self-heal instead
        // of wrongly expiring a real order and losing the sale.
        await prisma.$transaction([
          prisma.order.update({ where: { id: order.id }, data: { status: 'paid', reservedUntil: null } }),
          prisma.auditLog.create({
            data: {
              orderId: order.id,
              eventType: 'payment_reconciled_late',
              reasonText: 'Webhook was never received, but Razorpay confirmed payment on reconciliation check — order marked paid, stock retained',
            },
          }),
        ]);
        await sendOrderConfirmation(order.email, {
          customerName: order.customerName,
          orderId: order.id,
          items: order.items.map((i) => ({ name: i.product.name, qty: i.qty, unitPrice: i.unitPriceAtOrder })),
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
          trackingUrl: `${process.env.FRONTEND_URL}/track/${order.id}?token=${order.trackingToken}`,
        });
        logger.info({ orderId: order.id }, 'Order self-healed via reconciliation, webhook was missed but payment was real');
        continue;
      }

      // Genuinely unpaid/abandoned — safe to release stock, as before
      await releaseOrderStock(order.id);
      await prisma.$transaction([
        prisma.order.update({ where: { id: order.id }, data: { status: 'expired', reservedUntil: null } }),
        prisma.auditLog.create({
          data: { orderId: order.id, eventType: 'order_expired', reasonText: 'Checkout abandoned — stock released after TTL, confirmed unpaid via reconciliation' },
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
