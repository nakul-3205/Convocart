import { z } from 'zod';

export const AddToCartInput = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(5),
});