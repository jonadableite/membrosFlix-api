import { redisClient } from "../cache/redis.client.js";
import logger from "../logger/logger.js";

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  skipCache?: boolean;
}

export function Cache(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    const { ttl = 300, keyPrefix = "", skipCache = false } = options; // Default 5 minutes

    descriptor.value = async function (...args: any[]) {
      if (skipCache || !redisClient.isHealthy()) {
        return method.apply(this, args);
      }

      // Generate cache key
      const cacheKey = `${keyPrefix}${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      try {
        // Try to get from cache
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.debug(`Cache hit for key: ${cacheKey}`);
          return JSON.parse(cached);
        }

        // Execute method and cache result
        const result = await method.apply(this, args);

        // Cache the result
        await redisClient.set(cacheKey, JSON.stringify(result), ttl);
        logger.debug(`Cached result for key: ${cacheKey}`);

        return result;
      } catch (error) {
        logger.error(`Cache decorator error for ${propertyName}:`, error);
        // Fallback to original method
        return method.apply(this, args);
      }
    };

    return descriptor;
  };
}

// Helper function to invalidate cache by pattern
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    await redisClient.flushPattern(pattern);
    logger.info(`Cache invalidated for pattern: ${pattern}`);
  } catch (error) {
    logger.error("Cache invalidation error:", error);
  }
}

// Helper function to invalidate cache for specific entity
export async function invalidateEntityCache(
  entityName: string,
  id?: string | number
): Promise<void> {
  const pattern = id ? `${entityName}:*:${id}` : `${entityName}:*`;
  await invalidateCache(pattern);
}
