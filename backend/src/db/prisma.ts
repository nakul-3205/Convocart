import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

if (process.env.NODE_ENV === 'development') {
  // @ts-expect-error — event-mode logging isn't in the base PrismaClient type
  prisma.$on('query', (e: { query: string; duration: number }) => {
    logger.debug({ query: e.query, durationMs: e.duration }, 'prisma query');
  });
}
