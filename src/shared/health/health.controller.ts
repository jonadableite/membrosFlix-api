import { Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { redisClient } from "../cache/redis.client.js";
import { eventEmitter } from "../events/event.emitter.js";
import { CorrelatedRequest } from "../middlewares/correlation.middleware.js";

interface HealthCheck {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    eventEmitter: ServiceHealth;
  };
}

interface ServiceHealth {
  status: "healthy" | "unhealthy";
  responseTime?: number;
  error?: string;
}

/**
 * Basic health check endpoint
 */
export const healthCheck = async (
  _req: Request,
  res: Response
): Promise<void> => {
  // const startTime = Date.now();

  try {
    // Check database connection
    const dbHealth = await checkDatabase();

    // Check Redis connection
    const redisHealth = await checkRedis();

    // Check event emitter
    const eventHealth = checkEventEmitter();

    // const _responseTime = Date.now() - startTime;

    const health: HealthCheck = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      services: {
        database: dbHealth,
        redis: redisHealth,
        eventEmitter: eventHealth,
      },
    };

    // Determine overall health
    const allServicesHealthy = Object.values(health.services).every(
      (service) => service.status === "healthy"
    );

    health.status = allServicesHealthy ? "healthy" : "unhealthy";

    const statusCode = allServicesHealthy ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    const health: HealthCheck = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      services: {
        database: { status: "unhealthy", error: "Unknown error" },
        redis: { status: "unhealthy", error: "Unknown error" },
        eventEmitter: { status: "unhealthy", error: "Unknown error" },
      },
    };

    res.status(503).json(health);
  }
};

/**
 * Readiness check endpoint (for Kubernetes)
 */
export const readinessCheck = async (
  _req: Request,
  res: Response
): Promise<void> => {
  // const _startTime = Date.now();

  try {
    // Check if all critical services are ready
    const dbHealth = await checkDatabase();
    const redisHealth = await checkRedis();

    const isReady =
      dbHealth.status === "healthy" && redisHealth.status === "healthy";

    const response = {
      status: isReady ? "ready" : "not ready",
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
    };

    res.status(isReady ? 200 : 503).json(response);
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
};

/**
 * Liveness check endpoint (for Kubernetes)
 */
export const livenessCheck = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

/**
 * Detailed health check with tenant context
 */
export const detailedHealthCheck = async (
  req: CorrelatedRequest,
  res: Response
): Promise<void> => {
  const startTime = Date.now();

  try {
    req.logger.info("Detailed health check requested");

    // Check database with tenant context
    const dbHealth = await checkDatabaseWithTenant((req as any).tenantId);

    // Check Redis with tenant-specific keys
    const redisHealth = await checkRedisWithTenant((req as any).tenantId);

    // Check event emitter
    const eventHealth = checkEventEmitter();

    const responseTime = Date.now() - startTime;

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      responseTime,
      tenantId: (req as any).tenantId,
      correlationId: req.correlationId,
      services: {
        database: dbHealth,
        redis: redisHealth,
        eventEmitter: eventHealth,
      },
    };

    req.logger.info("Detailed health check completed", { responseTime });

    res.status(200).json(health);
  } catch (error) {
    req.logger.error("Detailed health check failed", error as Error);

    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
};

// Helper functions
async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "healthy",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkDatabaseWithTenant(
  tenantId?: string
): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    if (tenantId) {
      // Check tenant-specific data
      await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true },
      });
    } else {
      await prisma.$queryRaw`SELECT 1`;
    }

    return {
      status: "healthy",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkRedis(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const isHealthy = redisClient.isHealthy();
    if (!isHealthy) {
      throw new Error("Redis not connected");
    }

    // Test Redis with a simple operation
    await redisClient.set("health-check", "ok", 1);
    await redisClient.del("health-check");

    return {
      status: "healthy",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkRedisWithTenant(tenantId?: string): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const isHealthy = redisClient.isHealthy();
    if (!isHealthy) {
      throw new Error("Redis not connected");
    }

    // Test Redis with tenant-specific key
    const testKey = tenantId ? `health-check:${tenantId}` : "health-check";
    await redisClient.set(testKey, "ok", 1);
    await redisClient.del(testKey);

    return {
      status: "healthy",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function checkEventEmitter(): ServiceHealth {
  try {
    // Check if event emitter is properly initialized
    if (!eventEmitter) {
      throw new Error("Event emitter not initialized");
    }

    return {
      status: "healthy",
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
