import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { env } from '../config/env';

export const checkpointer = PostgresSaver.fromConnString(env.DATABASE_URL);

let setupDone = false;
export async function ensureCheckpointerSetup() {
  if (setupDone) return;
  await checkpointer.setup(); 
  setupDone = true;
}