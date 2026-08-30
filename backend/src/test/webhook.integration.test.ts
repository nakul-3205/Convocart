import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupIntegrationEnv, teardownIntegrationEnv } from './setup.integration';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

describe('webhook idempotency', () => {
  beforeAll(async () => {
    await setupIntegrationEnv();
    prisma = new PrismaClient();
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await teardownIntegrationEnv();
  });

  it('processing the same event id twice only records it once', async () => {
    const eventId = 'payment.captured:pay_test123';
    await prisma.processedWebhookEvent.create({ data: { razorpayEventId: eventId } });

    await expect(
      prisma.processedWebhookEvent.create({ data: { razorpayEventId: eventId } }),
    ).rejects.toThrow();

    expect(await prisma.processedWebhookEvent.count({ where: { razorpayEventId: eventId } })).toBe(
      1,
    );
  });
});
