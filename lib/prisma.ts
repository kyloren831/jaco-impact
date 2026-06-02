import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from 'pg';

declare global {
  var prisma : PrismaClient | undefined;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);

export const prisma = global.prisma || new PrismaClient({ adapter, log: ['query', 'error', 'info', 'warn'] });

if(process.env.NODE_ENV !== "production"){
  global.prisma = prisma;
}

/**
 * Utility wrapper for Prisma Interactive Transactions.
 * It allows nested functions to share a transaction context.
 * Useful for Command Handlers.
 */
import { AsyncLocalStorage } from "async_hooks";
export const transactionContext = new AsyncLocalStorage<Prisma.TransactionClient>();

export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const currentTx = transactionContext.getStore();
  if (currentTx) {
    return fn(currentTx);
  }
  return prisma.$transaction(async (tx) => {
    return transactionContext.run(tx, () => fn(tx));
  });
}
