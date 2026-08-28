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

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  // preserve the original order — Prisma's findMany doesn't guarantee it matches `ids` order
  return ids.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
}