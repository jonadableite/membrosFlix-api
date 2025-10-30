import winston from "winston";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../config/env.js";

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Development format with colors
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(
    ({
      timestamp,
      level,
      message,
      correlationId,
      tenantId,
      userId,
      ...meta
    }) => {
      let log = `${timestamp} [${level}]`;
      if (correlationId) log += ` [${correlationId}]`;
      if (tenantId) log += ` [tenant:${tenantId}]`;
      if (userId) log += ` [user:${userId}]`;
      log += `: ${message}`;

      if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }
      return log;
    }
  )
);

// Create logger instance
const logger = winston.createLogger({
  level: env.LOG_LEVEL || "info",
  format: env.NODE_ENV === "production" ? structuredFormat : developmentFormat,
  defaultMeta: {
    service: "membrosflix-api",
    version: process.env.npm_package_version || "1.0.0",
  },
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
});

// Add file logging in production
if (env.NODE_ENV === "production") {
  const DailyRotateFile = require("winston-daily-rotate-file");

  logger.add(
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "14d",
    })
  );

  logger.add(
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    })
  );
}

// Enhanced logger with correlation ID support
export class StructuredLogger {
  private correlationId: string;
  private tenantId: string | undefined;
  private userId: string | undefined;

  constructor(correlationId?: string, tenantId?: string, userId?: string) {
    this.correlationId = correlationId || uuidv4();
    this.tenantId = tenantId;
    this.userId = userId;
  }

  private createMeta(additionalMeta: any = {}) {
    return {
      correlationId: this.correlationId,
      tenantId: this.tenantId,
      userId: this.userId,
      ...additionalMeta,
    };
  }

  debug(message: string, meta: any = {}) {
    logger.debug(message, this.createMeta(meta));
  }

  info(message: string, meta: any = {}) {
    logger.info(message, this.createMeta(meta));
  }

  warn(message: string, meta: any = {}) {
    logger.warn(message, this.createMeta(meta));
  }

  error(message: string, error?: Error, meta: any = {}) {
    const errorMeta = error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : {};

    logger.error(message, this.createMeta({ ...meta, ...errorMeta }));
  }

  // Business-specific logging methods
  logUserAction(
    action: string,
    resource: string,
    resourceId: string,
    meta: any = {}
  ) {
    this.info(`User action: ${action}`, {
      action,
      resource,
      resourceId,
      ...meta,
    });
  }

  logTenantAction(action: string, tenantId: string, meta: any = {}) {
    this.info(`Tenant action: ${action}`, {
      action,
      tenantId,
      ...meta,
    });
  }

  logSecurityEvent(
    event: string,
    severity: "low" | "medium" | "high" | "critical",
    meta: any = {}
  ) {
    this.warn(`Security event: ${event}`, {
      event,
      severity,
      ...meta,
    });
  }

  logPerformance(operation: string, duration: number, meta: any = {}) {
    this.info(`Performance: ${operation}`, {
      operation,
      duration,
      ...meta,
    });
  }

  logNotificationSent(
    type: string,
    recipientId: string,
    tenantId: string,
    meta: any = {}
  ) {
    this.info(`Notification sent: ${type}`, {
      type,
      recipientId,
      tenantId,
      ...meta,
    });
  }
}

// Create a stream object for Morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Export default logger and structured logger
export default logger;
// export { StructuredLogger };
