import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db/prisma', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../db/prisma';
import { getCartSummary } from '../services/cart.services';

describe('getCartSummary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns an empty summary when the cart is empty', async () => {
    (prisma.session.findUnique as any).mockResolvedValue({ cart: [] });

    expect(await getCartSummary('session-1')).toEqual({
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
    });
  });

  it('correctly computes subtotal, delivery fee, and total', async () => {
    (prisma.session.findUnique as any).mockResolvedValue({
      cart: [{ productId: 'p1', qty: 2 }],
    });

    (prisma.product.findMany as any).mockResolvedValue([
      {
        id: 'p1',
        name: 'Trail Runner X (Size 9)',
        price: 349900,
      },
    ]);

    const result = await getCartSummary('session-1');

    expect(result.items[0]!.lineTotal).toBe(699800);
    expect(result.subtotal).toBe(699800);
    expect(result.deliveryFee).toBe(3000);
    expect(result.total).toBe(702800);
  });
});
