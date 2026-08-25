import { Request, Response, NextFunction } from 'express';
import { DeliveryDetails } from '../schemas/checkout.schema';
import { getCartSummary } from '../services/cart.services';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/ApiResponse';
import { confirmOrder } from '../services/order.services';

export async function checkoutPreviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = DeliveryDetails.safeParse(req.body);
    if (!parsed.success) throw new ApiError('BAD_REQUEST', 'Invalid delivery details', parsed.error.flatten());

    const cart = await getCartSummary(req.sessionId);
    if (cart.items.length === 0) throw new ApiError('CONFLICT', 'Cart is empty');

    return ok(res, { delivery: parsed.data, cart }); // pure preview — nothing written yet
  } catch (err) {
    next(err);
  }
}

export async function confirmOrderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = DeliveryDetails.safeParse(req.body);
    if (!parsed.success) throw new ApiError('BAD_REQUEST', 'Invalid delivery details', parsed.error.flatten());
    return ok(res, await confirmOrder(req.sessionId, parsed.data));
  } catch (err) {
    next(err);
  }
}