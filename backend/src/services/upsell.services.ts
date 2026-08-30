import { prisma } from '../db/prisma';

export async function getUpsellCandidate(cartProductIds: string[]) {
  if (cartProductIds.length === 0) return null;

  const candidates = await prisma.productCrossSell.findMany({
    where: { productId: { in: cartProductIds } },
    include: { crossSellProduct: true },
  });

  const eligible = candidates
    .map((c) => c.crossSellProduct)
    .filter((p) => p.stock > 0 && !cartProductIds.includes(p.id));

  if (eligible.length === 0) return null;

  const chosen = eligible[Math.floor(Math.random() * eligible.length)]!;
  return { productId: chosen.id, name: chosen.name, price: chosen.price / 100 };
}
