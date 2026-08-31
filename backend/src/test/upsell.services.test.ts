import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db/prisma', () => ({ prisma: { productCrossSell: { findMany: vi.fn() } } }));

import { prisma } from '../db/prisma';
import { getUpsellCandidate } from '../services/upsell.services';

describe('getUpsellCandidate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when the cart is empty', async () => {
    expect(await getUpsellCandidate([])).toBeNull();
  });

  it('returns null when no cross-sell rows exist', async () => {
    (prisma.productCrossSell.findMany as any).mockResolvedValue([]);
    expect(await getUpsellCandidate(['shoe-1'])).toBeNull();
  });

  it('never returns an out-of-stock candidate', async () => {
    (prisma.productCrossSell.findMany as any).mockResolvedValue([
      { crossSellProduct: { id: 'acc-1', name: 'Socks', price: 39900, stock: 0 } },
    ]);
    expect(await getUpsellCandidate(['shoe-1'])).toBeNull();
  });

  it('never returns a candidate already in the cart', async () => {
    (prisma.productCrossSell.findMany as any).mockResolvedValue([
      { crossSellProduct: { id: 'shoe-1', name: 'Same Shoe', price: 349900, stock: 5 } },
    ]);
    expect(await getUpsellCandidate(['shoe-1'])).toBeNull();
  });

  it('returns a valid candidate when one genuinely qualifies', async () => {
    (prisma.productCrossSell.findMany as any).mockResolvedValue([
      { crossSellProduct: { id: 'acc-1', name: 'Insoles', price: 59900, stock: 10 } },
    ]);
    expect(await getUpsellCandidate(['shoe-1'])).toEqual({
      productId: 'acc-1',
      name: 'Insoles',
      price: 599,
      reason: 'Insoles is a common add-on for this purchase.',
    });
  });
});
