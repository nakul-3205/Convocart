import './instrument';
import * as Sentry from '@sentry/node';
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { requestLogger } from './middlewares/request.logger.middleware';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { logger } from './utils/logger';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { sessionMiddleware } from './middlewares/session.middleware';
import { prisma } from './db/prisma';
import productsRouter from './routes/product.routes';
import chatRouter from './routes/chat.routes';
import { ensureCheckpointerSetup } from './agent/checkpointer';
import cartRouter from './routes/cart.routes';
import webhookRouter from './routes/webhook.routes';
import './queue/webhook.worker';
import { scheduleCleanupJob } from './queue/cleanup.worker';
import './queue/cleanup.worker';
import './queue/chat.worker';
import adminRouter from './routes/admin.routes';




const app = express();

app.use(helmet());

app.use(
  cors({
    origin: '*', //process.env.FRONTEND_URL ||
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(requestLogger);
async function start() {
  await ensureCheckpointerSetup();
  await scheduleCleanupJob();
  await ensureCheckpointerSetup();
  const server = app.listen(PORT, () => logger.info(`Convocart backend running on :${PORT}`));
}
start();
app.use('/api/webhooks', webhookRouter);
app.use('/api/admin', adminRouter);
app.use('/api/products', productsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/cart', cartRouter);
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable' });
  }
});

async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Shutdown complete');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => logger.info(`Convocart backend running on :${PORT}`));
