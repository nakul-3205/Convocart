import { Request, Response, NextFunction } from 'express';
import { getOrderByTrackingToken } from '../services/track.services';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/ApiResponse';

export async function trackOrderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const rawId = req.params.orderId;
    const orderId = typeof rawId === 'string' ? rawId : rawId?.[0];
    const token = typeof req.query.token === 'string' ? req.query.token : undefined;

    if (!orderId || !token) {
      throw new ApiError('BAD_REQUEST', 'Missing orderId or token');
    }

    const order = await getOrderByTrackingToken(orderId, token);
    if (!order) {
      throw new ApiError('NOT_FOUND', 'Order not found');
    }

    return ok(res, {
      status: order.status,
      items: order.items.map((i) => ({ name: i.product.name, qty: i.qty, unitPrice: i.unitPriceAtOrder })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      address:order.address,
      pincode:order.pincode,
      phoneNo:order.phone,
      createdAt: order.createdAt,
      timeline: order.auditLogs.map((a) => ({ eventType: a.eventType, reasonText: a.reasonText, at: a.createdAt })),
    });
  } catch (err) {
    next(err);
  }
}