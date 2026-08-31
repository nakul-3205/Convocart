import './instrument';
import * as Sentry from '@sentry/node';
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { Server } from 'http';
import { env } from './config/env';

import { requestLogger } from './middlewares/request.logger.middleware';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { sessionMiddleware } from './middlewares/session.middleware';
import { logger } from './utils/logger';
import { prisma } from './db/prisma';

import productsRouter from './routes/product.routes';
import chatRouter from './routes/chat.routes';
import cartRouter from './routes/cart.routes';
import webhookRouter from './routes/webhook.routes';
import adminRouter from './routes/admin.routes';
import trackRouter from './routes/track.routes';

import { ensureCheckpointerSetup } from './agent/checkpointer';
import { scheduleCleanupJob } from './queue/cleanup.worker';
import './queue/webhook.worker';
import './queue/chat.worker';

const PORT = Number(env.PORT);
const FRONTEND_URL = env.FRONTEND_URL;
if (!FRONTEND_URL) {
  logger.warn('FRONTEND_URL is not set CORS will reject all browser origins');
}

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https://res.cloudinary.com', 'https://placehold.co'],
      },
    },
  }),
);

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.set('trust proxy', 1);

app.use((req, res, next) => {
  if (req.path.startsWith('/api/webhooks')) return next();
  return limiter(req, res, next);
});

app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));
app.use((req, res, next) => {
  if (req.path === '/api/webhooks/razorpay') return next();
  return express.json()(req, res, next);
});

app.use(cookieParser());
app.use(sessionMiddleware);
app.use(requestLogger);

app.use('/api/webhooks', webhookRouter);
app.use('/api/admin', adminRouter);
app.use('/api/products', productsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/cart', cartRouter);
app.use('/api/track', trackRouter);
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable' });
  }
});

Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

let server: Server;

async function start() {
  await ensureCheckpointerSetup();
  await scheduleCleanupJob();

  server = app.listen(PORT, () => {
    logger.info(`Convocart backend running on :${PORT}`);
  });
}

async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully`);

  if (!server) {
    await prisma.$disconnect();
    process.exit(0);
    return;
  }

  const forceExit = setTimeout(() => {
    logger.warn('Forced shutdown: connections did not close in time');
    process.exit(1);
  }, 10_000);

  server.close(async () => {
    clearTimeout(forceExit);
    await prisma.$disconnect();
    logger.info('Shutdown complete');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
