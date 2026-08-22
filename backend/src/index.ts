import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { requestLogger } from './middlewares/request.logger.middleware';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { logger } from './utils/logger';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
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
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.get('/health', async (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => logger.info(`Convocart backend running on :${PORT}`));
