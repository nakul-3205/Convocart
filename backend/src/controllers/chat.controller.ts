import { Request, Response, NextFunction } from 'express';
import { ChatMessageInput } from '../schemas/chat.schema';
import { runAgentTurn } from '../agent/runTurn';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/ApiResponse';

import { chatQueue, chatQueueEvents } from '../queue/chat.queue';

export async function sendMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = ChatMessageInput.safeParse(req.body);
    if (!parsed.success) throw new ApiError('BAD_REQUEST', 'Invalid message', parsed.error.flatten());
    const { message } = parsed.data;
    const sessionId = req.sessionId;

    await prisma.message.create({ data: { sessionId, role: 'user', content: message } });

    const job = await chatQueue.add('turn', { sessionId, message });
    const output = await job.waitUntilFinished(chatQueueEvents, 60_000); // waits its turn, up to 60s

    await prisma.message.create({ data: { sessionId, role: 'assistant', content: output.reply } });
    return ok(res, output);
  } catch (err) {
    next(err);
  }
}