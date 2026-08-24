import { Request, Response, NextFunction } from 'express';
import { ProductSearchQuery } from '../schemas/product.schema';
import { searchProducts } from '../services/products.services';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/ApiResponse';

export async function searchProductsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = ProductSearchQuery.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError('BAD_REQUEST', 'Invalid search parameters', parsed.error.flatten());
    }
    const result = await searchProducts(parsed.data);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}