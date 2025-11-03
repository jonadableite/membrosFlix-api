import Redis from "ioredis";
import { env } from "../../config/env.js";
import logger from "../logger/logger.js";

class RedisClient {
  private client: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.connect().catch((error) => {
      logger.error("Failed to connect to Redis during initialization:", error);
    });
  }

  private async connect(): Promise<void> {
    try {
      if (env.REDIS_URL) {
        this.client = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
        });

        this.client.on("connect", () => {
          this.isConnected = true;
          logger.info("Redis connected successfully");
        });

        this.client.on("ready", () => {
          this.isConnected = true;
          logger.info("Redis ready for commands");
        });

        this.client.on("error", (error) => {
          this.isConnected = false;
          logger.error("Redis connection error:", error);
        });

        this.client.on("close", () => {
          this.isConnected = false;
          logger.warn("Redis connection closed");
        });

        // Force connection
        try {
          await this.client.ping();
          logger.info("Redis ping successful");
        } catch (error) {
          logger.error("Redis ping failed:", error);
        }
      } else {
        logger.warn("Redis URL not provided, caching disabled");
      }
    } catch (error) {
      logger.error("Failed to initialize Redis:", error);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error("Redis GET error:", error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error("Redis SET error:", error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error("Redis DEL error:", error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error("Redis EXISTS error:", error);
      return false;
    }
  }

  async flushPattern(pattern: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error("Redis FLUSH PATTERN error:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info("Redis disconnected");
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

export const redisClient = new RedisClient();
export default redisClient;
