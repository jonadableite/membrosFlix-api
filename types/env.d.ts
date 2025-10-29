declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      REDIS_URL?: string;
      MINIO_ENDPOINT: string;
      MINIO_PORT: string;
      MINIO_ACCESS_KEY: string;
      MINIO_SECRET_KEY: string;
      MINIO_BUCKET_NAME: string;
      MINIO_USE_SSL: string;
      CORS_ORIGIN: string;
      LOG_LEVEL: string;
    }
  }
}

export {};