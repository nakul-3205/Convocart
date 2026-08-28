import { tool } from '@langchain/core/tools';
import { ProductSearchQuery } from '../schemas/product.schema';
import { searchProducts } from '../services/products.services';
import { addToCart } from '../services/cart.services';
import { z } from 'zod';

export const searchProductsTool = tool(
  async (input) => {
    const result = await searchProducts(ProductSearchQuery.parse(input));
    return JSON.stringify({
      items: result.items.map((p) => ({ id: p.id, name: p.name, price: p.price / 100, size: p.size })),
      total: result.total, 
      hasMore: result.hasMore,
    });
  },
  {
    name: 'search_products',
    description: 'Search the shoe catalog by sub-category, size, and max price. Use whenever the customer describes what they want.',
    schema: ProductSearchQuery.omit({ page: true, pageSize: true }),
  },
);

export function buildAddToCartTool(sessionId: string) {
  return tool(
    async ({ productId, qty }) => {
      const summary = await addToCart(sessionId, productId, qty);
      return JSON.stringify(summary);
    },
    {
      name: 'add_to_cart',
      description: 'Add a product to the customer\'s cart by its exact product ID (from a prior search_products result) and quantity.',
      schema: z.object({ productId: z.string(), qty: z.number().int().min(1).max(5) }),
    },
  );
}