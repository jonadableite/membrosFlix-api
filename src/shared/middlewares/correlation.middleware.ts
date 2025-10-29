import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { AsyncLocalStorage } from "async_hooks";

// AsyncLocalStorage para armazenar correlation ID
const asyncLocalStorage = new AsyncLocalStorage<string>();

export const getCorrelationId = (): string | undefined => {
  return asyncLocalStorage.getStore();
};

export interface CorrelatedRequest extends Request {
  correlationId: string;
  startTime: number;
  logger: {
    info: (message: string, meta?: any) => void;
    error: (message: string, error?: Error) => void;
    warn: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
  };
}

/**
 * Middleware to add correlation ID and structured logging to requests
 */
export const correlationMiddleware = (
  req: CorrelatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Generate or extract correlation ID
  const correlationId = (req.headers["x-correlation-id"] as string) || uuidv4();

  // Add to request
  req.correlationId = correlationId;
  req.startTime = Date.now();
  
  // Add logger to request
  req.logger = {
    info: (message: string, meta?: any) => console.log(`[INFO] ${correlationId}: ${message}`, meta),
    error: (message: string, error?: Error) => console.error(`[ERROR] ${correlationId}: ${message}`, error),
    warn: (message: string, meta?: any) => console.warn(`[WARN] ${correlationId}: ${message}`, meta),
    debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${correlationId}: ${message}`, meta),
  };

  // Add correlation ID to response headers
  res.set("X-Correlation-ID", correlationId);

  // Run the request in async context
  asyncLocalStorage.run(correlationId, () => {
    next();
  });
};

/**
 * Error logging middleware
 */
export const errorLoggingMiddleware = (
  error: Error,
  req: CorrelatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const correlationId = getCorrelationId();
  
  // Fallback logging
  console.error("Request error:", {
    correlationId,
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    statusCode: res.statusCode || 500,
  });

  next(error);
};
