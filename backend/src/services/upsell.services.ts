import { prisma } from '../db/prisma';

const REASON_TEMPLATES: Record<string, (name: string) => string> = {
  running: (name) => `Running shoe customers often add ${name} for extra comfort on long runs.`,
  casual: (name) => `${name} is a popular pairing with casual sneakers for everyday wear.`,
  formal: (name) => `${name} helps keep formal leather shoes looking sharp for longer.`,
};

export async function getUpsellCandidate(cartProductIds: string[]) {
  if (cartProductIds.length === 0) return null;

  const candidates = await prisma.productCrossSell.findMany({
    where: { productId: { in: cartProductIds } },
    include: { crossSellProduct: true },
  });

  const eligible = candidates
    .map((c) => c.crossSellProduct)
    .filter((p) => p.stock > 0 && !cartProductIds.includes(p.id))
    .filter((p, index, arr) => arr.findIndex((x) => x.id === p.id) === index); // dedupe

  if (eligible.length === 0) return null;

  const sorted = [...eligible].sort((a, b) => a.price - b.price);
  const chosen = sorted[0]!;

  const reasonTemplate =
    REASON_TEMPLATES[chosen.subCategory ?? ''] ??
    ((name: string) => `${name} is a common add-on for this purchase.`);

  return {
    productId: chosen.id,
    name: chosen.name,
    price: chosen.price / 100,
    reason: reasonTemplate(chosen.name),
  };
}
