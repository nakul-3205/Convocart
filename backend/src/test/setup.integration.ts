import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { execSync } from 'child_process';

let pgContainer: StartedPostgreSqlContainer;
let redisContainer: StartedRedisContainer;

export async function setupIntegrationEnv() {
  pgContainer = await new PostgreSqlContainer('postgres:16').start();
  redisContainer = await new RedisContainer('redis:7').start();
  process.env.DATABASE_URL = pgContainer.getConnectionUri();
  process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
  execSync('npx prisma db push --skip-generate', { env: process.env, stdio: 'inherit' });
}

export async function teardownIntegrationEnv() {
  await pgContainer.stop();
  await redisContainer.stop();
}