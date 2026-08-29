import { prisma } from '../db/prisma';
import type { ProductSearchQueryType } from '../schemas/product.schema';

export async function searchProducts(query: ProductSearchQueryType, excludeIds: string[] = []) {
  const { subCategory, size, maxPrice, page, pageSize } = query;

  const where = {
    category: 'shoes' as const,
    ...(subCategory && { subCategory }),
    ...(size && { size }),
    ...(maxPrice !== undefined && { price: { lte: maxPrice * 100 } }),
    ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { price: 'asc' } }),
    prisma.product.count({ where }),
  ]);

  return { items, page, pageSize, total, hasMore: page * pageSize < total };
}

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  return ids.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
}