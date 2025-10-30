import { PrismaClient } from "@prisma/client";
import { logger } from './logger.js';

declare global {
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { level: "query", emit: "event" },
            { level: "error", emit: "event" },
          ]
        : [{ level: "error", emit: "event" }],
  });

  // Log queries in development
  if (process.env.NODE_ENV === "development") {
    client.$on("query", (e) => {
      logger.debug("Database Query:", {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    });
  }

  // Log errors
  client.$on("error", (e) => {
    logger.error("Database Error:", e);
  });

  return client;
};

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info("Database disconnected successfully");
  } catch (error) {
    logger.error("Failed to disconnect from database:", error);
  }
};
