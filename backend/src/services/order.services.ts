import { prisma } from '../db/prisma';
import { razorpay } from './razorpay.client';
import { getCartSummary } from './cart.services';
import { ApiError } from '../utils/ApiError';
import type { z } from 'zod';
import type { DeliveryDetails } from '../schemas/checkout.schema';
import { redis } from '../db/redis';

const RESERVATION_MINUTES = 15;

export async function confirmOrder(sessionId: string, delivery: z.infer<typeof DeliveryDetails>) {
  const cart = await getCartSummary(sessionId);
  if (cart.items.length === 0) throw new ApiError('CONFLICT', 'Cart is empty');
  const lockKey = `checkout-lock:${sessionId}`;
  const acquired = await redis.set(lockKey, '1', 'EX', 30, 'NX'); // 30s is a dead-process safety net; the finally below releases it in the normal case
  if (!acquired) {
    throw new ApiError('CONFLICT', 'A checkout is already in progress for this session');
  }

  try {
    let createdOrder: { id: string; total: number };

    await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const result: { stock: number }[] = await tx.$queryRaw`
          UPDATE "Product" SET stock = stock - ${item.qty}
          WHERE id = ${item.productId} AND stock >= ${item.qty}
          RETURNING stock
        `;
        if (result.length === 0) {
          throw new ApiError('CONFLICT', `${item.name} just sold out — sorry about that.`);
        }
      }

      createdOrder = await tx.order.create({
        data: {
          sessionId,
          status: 'pending',
          subtotal: cart.subtotal,
          deliveryFee: cart.deliveryFee,
          total: cart.total,
          customerName: delivery.customerName,
          phone: delivery.phone,
          email: delivery.email,
          address: delivery.address,
          pincode: delivery.pincode,
          deliveryNotes: delivery.deliveryNotes ?? null,
          reservedUntil: new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000),
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              qty: i.qty,
              unitPriceAtOrder: i.unitPrice,
            })),
          },
        },
      });

      
      await tx.auditLog.create({
        data: {
          orderId: createdOrder.id,
          sessionId,
          eventType: 'order_created',
          reasonText: `Order placed — ${cart.items.length} item(s), ₹${cart.total / 100} total, stock reserved for ${RESERVATION_MINUTES} min`,
        },
      });
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: createdOrder!.total, // already in paise
      currency: 'INR',
      receipt: createdOrder!.id,
    });

    const updated = await prisma.order.update({
      where: { id: createdOrder!.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    await prisma.session.update({ where: { id: sessionId }, data: { cart: [] } });

    return {
      orderId: updated.id,
      razorpayOrderId: razorpayOrder.id,
      amount: updated.total,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } finally {
    await redis.del(lockKey);
  }
}
