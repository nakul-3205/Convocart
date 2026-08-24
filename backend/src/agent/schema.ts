import { z } from 'zod';

export const AgentTurnOutput = z.object({
  reply: z.string().min(1).max(600),
  recommendedProductIds: z.array(z.string()).max(3), 
  upsellProductId: z.string().nullable(),
  upsellReason: z.string().max(150).nullable(),
  needsClarification: z.boolean(),
});

export type AgentTurnOutputType = z.infer<typeof AgentTurnOutput>;