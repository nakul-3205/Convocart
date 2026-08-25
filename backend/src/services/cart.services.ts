import { prisma } from '../db/prisma';

type CartLine = { productId: string; qty: number };

async function getCart(sessionId: string): Promise<CartLine[]> {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  return (session?.cart as CartLine[] | null) ?? [];
}

async function saveCart(sessionId: string, cart: CartLine[]) {
  await prisma.session.update({ where: { id: sessionId }, data: { cart } });
}

export async function addToCart(sessionId: string, productId: string, qty: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('Product not found');

  const cart = await getCart(sessionId);
  const existing = cart.find((c) => c.productId === productId);
  const newQty = Math.min((existing?.qty ?? 0) + qty, 5);

  if (existing) existing.qty = newQty;
  else cart.push({ productId, qty: newQty });

  await saveCart(sessionId, cart);
  return getCartSummary(sessionId);
}

export async function removeFromCart(sessionId: string, productId: string) {
  const cart = (await getCart(sessionId)).filter((c) => c.productId !== productId);
  await saveCart(sessionId, cart);
  return getCartSummary(sessionId);
}

const DELIVERY_FEE = 3000;

export async function getCartSummary(sessionId: string) {
  const cart = await getCart(sessionId);
  if (cart.length === 0) return { items: [], subtotal: 0, deliveryFee: 0, total: 0 };

  const products = await prisma.product.findMany({ where: { id: { in: cart.map((c) => c.productId) } } });
  const items = cart.map((line) => {
    const product = products.find((p) => p.id === line.productId)!;
    return { productId: product.id, name: product.name, unitPrice: product.price, qty: line.qty, lineTotal: product.price * line.qty };
  });

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { items, subtotal, deliveryFee: DELIVERY_FEE, total: subtotal + DELIVERY_FEE };
}