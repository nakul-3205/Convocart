import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { webhookQueue } from '../queue/webhook.queue';
import { logger } from '../utils/logger';

export async function razorpayWebhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody = (req as any).rawBody as Buffer; 

    if (!signature || !rawBody) {
      logger.warn('Webhook missing signature or raw body');
      return res.status(400).json({ error: 'Bad request' });
    }

    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');


    const valid =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

    if (!valid) {
      logger.warn('Webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody.toString());
    await webhookQueue.add('process-event', event);

    return res.status(200).json({ received: true }); 
  } catch (err) {
    next(err);
  }
}