import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  REDIS_URL: z.string().optional(),

  // Email configuration
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_SECURE: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_FROM_NAME: z.string().optional(),

  // Frontend URL
  FRONTEND_URL: z.string().optional(),
  MINIO_ENDPOINT: z.string().min(1, "MinIO endpoint is required"),
  MINIO_PORT: z.string().default("9000"),
  MINIO_ACCESS_KEY: z.string().min(1, "MinIO access key is required"),
  MINIO_SECRET_KEY: z.string().min(1, "MinIO secret key is required"),
  MINIO_BUCKET_NAME: z.string().default("membrosflix"),
  MINIO_USE_SSL: z.string().default("false"),
  CORS_ORIGIN: z.string().default("*"),
  LOG_LEVEL: z.string().default("info"),

  // Multi-tenancy
  DEFAULT_TENANT_ID: z
    .string()
    .uuid("DEFAULT_TENANT_ID must be a valid UUID")
    .optional(),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(
        (err: any) => `${err.path.join(".")}: ${err.message}`
      );

      console.error("❌ Invalid environment variables:");
      errorMessages.forEach((msg: any) => console.error(`  - ${msg}`));
      process.exit(1);
    }

    throw error;
  }
};

export const env = parseEnv();

export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
