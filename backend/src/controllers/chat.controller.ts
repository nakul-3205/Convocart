import { Request, Response, NextFunction } from 'express';
import { ChatMessageInput } from '../schemas/chat.schema';
import { chatQueue, chatQueueEvents } from '../queue/chat.queue';
import { getProductsByIds } from '../services/products.services';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/ApiResponse';

export async function sendMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = ChatMessageInput.safeParse(req.body);
    if (!parsed.success)
      throw new ApiError('BAD_REQUEST', 'Invalid message', parsed.error.flatten());

    const { message } = parsed.data;
    const sessionId = req.sessionId;

    await prisma.message.create({ data: { sessionId, role: 'user', content: message } });

    const job = await chatQueue.add('turn', { sessionId, message });
    const output = await job.waitUntilFinished(chatQueueEvents, 60_000);

    await prisma.message.create({ data: { sessionId, role: 'assistant', content: output.reply } });

    const [recommendedProducts, upsellProductArr] = await Promise.all([
      getProductsByIds(output.recommendedProductIds),
      output.upsellProductId ? getProductsByIds([output.upsellProductId]) : Promise.resolve([]),
    ]);

    return ok(res, {
      reply: output.reply,
      recommendedProducts,
      upsellProduct: upsellProductArr[0] ?? null,
      upsellReason: output.upsellReason,
      needsClarification: output.needsClarification,
    });
  } catch (err) {
    next(err);
  }
}
