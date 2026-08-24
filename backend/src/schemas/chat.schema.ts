import { z } from 'zod';

export const ChatMessageInput = z.object({
  message: z.string().min(1).max(1000),
});