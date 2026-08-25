import { prisma } from '../db/prisma';

export async function releaseOrderStock(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  await prisma.$transaction(
    items.map((item) =>
      prisma.$executeRaw`UPDATE "Product" SET stock = stock + ${item.qty} WHERE id = ${item.productId}`,
    ),
  );
}