import { Request, Response, NextFunction } from 'express';
import { AddToCartInput } from '../schemas/cart.schema';
import { addToCart, removeFromCart, getCartSummary } from '../services/cart.services';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/ApiResponse';

export async function getCartHandler(req: Request, res: Response, next: NextFunction) {
  try {
    return ok(res, await getCartSummary(req.sessionId));
  } catch (err) {
    next(err);
  }
}

export async function addToCartHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = AddToCartInput.safeParse(req.body);
    if (!parsed.success) throw new ApiError('BAD_REQUEST', 'Invalid cart item', parsed.error.flatten());
    return ok(res, await addToCart(req.sessionId, parsed.data.productId, parsed.data.qty));
  } catch (err) {
    next(err);
  }
}

export async function removeFromCartHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = req.params.productId;
    const productId = typeof raw === 'string' ? raw : raw?.[0];
    if (!productId) throw new ApiError('BAD_REQUEST', 'Missing productId');

    return ok(res, await removeFromCart(req.sessionId, productId));
  } catch (err) {
    next(err);
  }
}