import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupIntegrationEnv, teardownIntegrationEnv } from './setup.integration';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

describe('stock reservation under concurrency', () => {
  beforeAll(async () => {
    await setupIntegrationEnv();
    prisma = new PrismaClient();
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await teardownIntegrationEnv();
  });

  it('allows exactly 2 successful reservations when 5 requests race for 2 units of stock', async () => {
    const product = await prisma.product.create({
      data: { name: 'Test Shoe', category: 'shoes', description: 'x', price: 100000, stock: 2 },
    });

    const attempts = Array.from(
      { length: 5 },
      () =>
        prisma.$executeRaw`UPDATE "Product" SET stock = stock - 1 WHERE id = ${product.id} AND stock >= 1`,
    );
    const results = await Promise.all(attempts);
    const successCount = results.filter((r) => r === 1).length;

    expect(successCount).toBe(2);
    const final = await prisma.product.findUnique({ where: { id: product.id } });
    expect(final?.stock).toBe(0);
  });
});
