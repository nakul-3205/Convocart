import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ProductSearchQuery } from '../schemas/product.schema';
import { searchProducts } from '../services/products.services';
import { addToCart } from '../services/cart.services';
import { prisma } from '../db/prisma';

export const searchProductsTool = tool(
  async (input, config) => {
    const sessionId = config?.configurable?.thread_id as string | undefined;

    let excludeIds: string[] = [];
    if (sessionId) {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      excludeIds = (session?.shownProductIds as string[] | null) ?? [];
    }

    const result = await searchProducts(ProductSearchQuery.parse(input), excludeIds);


    if (sessionId && result.items.length > 0) {
      const newIds = result.items.map((p) => p.id);
      const merged = Array.from(new Set([...excludeIds, ...newIds]));
      await prisma.session.update({ where: { id: sessionId }, data: { shownProductIds: merged } });
    }

    return JSON.stringify({
      items: result.items.map((p) => ({ id: p.id, name: p.name, price: p.price / 100, size: p.size })),
      total: result.total,
      hasMore: result.hasMore,
    });
  },
  {
    name: 'search_products',
    description: 'Search the shoe catalog by sub-category, size, and max price. Use whenever the customer describes what they want, or asks to see more/different options.',
    schema: ProductSearchQuery.omit({ page: true, pageSize: true }),
  },
);

export const addToCartTool = tool(
  async (input: { productId: string; qty: number }, config) => {
    const sessionId = config?.configurable?.thread_id as string | undefined;
    if (!sessionId) {
      throw new Error('Missing session context for add_to_cart — this should never happen if called through the normal chat flow');
    }
    const summary = await addToCart(sessionId, input.productId, input.qty);
    return JSON.stringify(summary);
  },
  {
    name: 'add_to_cart',
    description:
      "Add a product to the customer's cart by its exact product ID (from a prior search_products result) and quantity. Always call this when a customer asks to add or order something — never claim an item was added without actually calling it first.",
    schema: z.object({
      productId: z.string().describe('The exact id field from a search_products result — never a product name'),
      qty: z.number().int().min(1).max(5),
    }),
  },
);