import { prisma } from '../db/prisma';
import crypto from 'crypto';

export async function getOrderByTrackingToken(orderId: string, token: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, auditLogs: { orderBy: { createdAt: 'asc' } } },
  });

  if (!order) return null;

  const tokenBuf = Buffer.from(token);
  const realBuf = Buffer.from(order.trackingToken);
  const valid = tokenBuf.length === realBuf.length && crypto.timingSafeEqual(tokenBuf, realBuf);

  if (!valid) return null;

  return order;
}