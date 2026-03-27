import { PrismaClient } from "@prisma/client";

// 构建 PrismaClient 单例，防止在 Next.js 热重载 (HMR) 时创建出无数个数据库连接池把 Neon 数据库干崩
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    url: process.env.DATABASE_URL, // Prisma 7 要求在此处传入直连 URL 或适配器
    // 如果想要排查数据库问题，可以打开 query 的日志
    // log: ['query'],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
