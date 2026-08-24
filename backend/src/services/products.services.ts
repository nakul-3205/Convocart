import { prisma } from '../db/prisma';
import type { ProductSearchQueryType } from '../schemas/product.schema';

export async function searchProducts(query: ProductSearchQueryType) {
  const { subCategory, size, maxPrice, page, pageSize } = query;

  const where = {
    category: 'shoes' as const, // single-category catalog for now
    ...(subCategory && { subCategory }),
    ...(size && { size }),
    ...(maxPrice !== undefined && { price: { lte: maxPrice * 100 } }),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { price: 'asc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, page, pageSize, total, hasMore: page * pageSize < total };
}