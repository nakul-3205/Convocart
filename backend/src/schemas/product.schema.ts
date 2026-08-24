import { z } from 'zod';

export const ProductSearchQuery = z.object({
  subCategory: z.enum(['running', 'casual', 'formal']).optional(),
  size: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(3),
});

export type ProductSearchQueryType = z.infer<typeof ProductSearchQuery>;
