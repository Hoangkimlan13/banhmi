// packages/database/index.ts
import { PrismaClient } from '@prisma/client';
import { db } from './src/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export { db } from "./src/client";

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export * from '@prisma/client';