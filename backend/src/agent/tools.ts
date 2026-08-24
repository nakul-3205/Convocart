import { tool } from '@langchain/core/tools';
import { ProductSearchQuery } from '../schemas/product.schema';
import { searchProducts } from '../services/products.services';

export const searchProductsTool = tool(
  async (input) => {
    const result = await searchProducts(ProductSearchQuery.parse(input));
    // Only what the LLM needs to phrase a reply  never raw DB rows
    return JSON.stringify({
      items: result.items.map((p) => ({ id: p.id, name: p.name, price: p.price / 100, size: p.size })),
      hasMore: result.hasMore,
    });
  },
  {
    name: 'search_products',
    description: 'Search the shoe catalog by sub-category, size, and max price. Use whenever the customer describes what they want.',
    schema: ProductSearchQuery.omit({ page: true, pageSize: true }), // pagination stays out of the LLM's control
  },
);