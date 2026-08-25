import { prisma } from '../db/prisma';
import { razorpay } from './razorpay.client';
import { getCartSummary } from './cart.services';
import { ApiError } from '../utils/ApiError';
import type { z } from 'zod';
import type { DeliveryDetails } from '../schemas/checkout.schema';

const RESERVATION_MINUTES = 15;

export async function confirmOrder(sessionId: string, delivery: z.infer<typeof DeliveryDetails>) {
  const cart = await getCartSummary(sessionId);
  if (cart.items.length === 0) throw new ApiError('CONFLICT', 'Cart is empty');

  // Atomic, qty-aware stock reservation — this is the exact query from the stock-race discussion
  const reservedItems: { productId: string; qty: number }[] = [];
  try {
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
        reservedItems.push({ productId: item.productId, qty: item.qty });
      }

      await tx.order.create({
        data: {
          sessionId,
          status: 'pending',
          subtotal: cart.subtotal,
          deliveryFee: cart.deliveryFee,
          total: cart.total,
          customerName: delivery.customerName,
          phone: delivery.phone,
          address: delivery.address,
          pincode: delivery.pincode,
          deliveryNotes: delivery.deliveryNotes ?? null,
          reservedUntil: new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000),
          items: { create: cart.items.map((i) => ({ productId: i.productId, qty: i.qty, unitPriceAtOrder: i.unitPrice })) },
        },
      });
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw err;
  }

  // Fetch the order we just created (transaction doesn't return it directly above in a typed way)
  const order = await prisma.order.findFirst({
    where: { sessionId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
  });
  if (!order) throw new Error('Order creation failed unexpectedly');

  // Now create the Razorpay order — outside the DB transaction, since it's a network call
  const razorpayOrder = await razorpay.orders.create({
    amount: order.total, // already in paise
    currency: 'INR',
    receipt: order.id,
  });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: razorpayOrder.id },
  });

  // Cart is now "spent" — clear it so the same items can't be reserved twice
  await prisma.session.update({ where: { id: sessionId }, data: { cart: [] } });

  return {
    orderId: updated.id,
    razorpayOrderId: razorpayOrder.id,
    amount: updated.total,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID, // safe to expose — this is the public key, frontend needs it for Checkout.js
  };
}