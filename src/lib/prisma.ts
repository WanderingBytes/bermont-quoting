import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

/* eslint-disable @typescript-eslint/no-explicit-any */
const g = globalThis as any;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Reuse existing pool if one exists from previous HMR cycles
  if (!g.__pg_pool) {
    g.__pg_pool = new pg.Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 30000,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(g.__pg_pool as any);
  return new PrismaClient({ adapter });
}

if (!g.__prisma) {
  g.__prisma = createPrismaClient();
}

const prisma: PrismaClient = g.__prisma;

export { prisma };
export default prisma;
