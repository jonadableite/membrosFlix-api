import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { AppError } from "@/shared/errors/app.error";
import logger from "@/shared/logger/logger";

/**
 * Advanced security middleware configuration
 */
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Remove null bytes
  const sanitizeString = (str: string): string => {
    return str.replace(/\0/g, "");
  };

  // Sanitize body
  if (req.body && typeof req.body === "object") {
    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      if (obj && typeof obj === "object") {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === "string") {
            sanitized[key] = sanitizeString(value);
          } else {
            sanitized[key] = sanitizeObject(value);
          }
        }
        return sanitized;
      }

      return obj;
    };

    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === "object") {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        req.query[key] = sanitizeString(value);
      }
    }
  }

  next();
};

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const clientIP =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    if (!clientIP) {
      throw new AppError("Unable to determine client IP", 400);
    }

    if (!allowedIPs.includes(clientIP)) {
      logger.warn(`Blocked request from unauthorized IP: ${clientIP}`, {
        ip: clientIP,
        userAgent: req.get("User-Agent"),
        url: req.url,
      });

      throw new AppError("Access denied from this IP address", 403);
    }

    next();
  };
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (maxSize: number) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get("content-length") || "0", 10);

    if (contentLength > maxSize) {
      logger.warn(`Request size exceeded limit: ${contentLength} bytes`, {
        contentLength,
        maxSize,
        url: req.url,
        ip: req.ip,
      });

      throw new AppError(
        `Request too large. Maximum size: ${maxSize} bytes`,
        413
      );
    }

    next();
  };
};

/**
 * SQL injection protection middleware
 */
export const sqlInjectionProtection = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
    /(\bUNION\s+SELECT\b)/i,
    /(\bDROP\s+TABLE\b)/i,
    /(\bINSERT\s+INTO\b)/i,
    /(\bDELETE\s+FROM\b)/i,
    /(\bUPDATE\s+SET\b)/i,
    /(\bALTER\s+TABLE\b)/i,
    /(\bEXEC\s*\()/i,
    /(\bSCRIPT\b)/i,
    /(\bJAVASCRIPT\b)/i,
    /(\bVBSCRIPT\b)/i,
    /(\bONLOAD\b)/i,
    /(\bONERROR\b)/i,
    /(\bONCLICK\b)/i,
    /(\bONMOUSEOVER\b)/i,
  ];

  const checkForInjection = (value: any): boolean => {
    if (typeof value === "string") {
      return dangerousPatterns.some((pattern) => pattern.test(value));
    }

    if (Array.isArray(value)) {
      return value.some(checkForInjection);
    }

    if (value && typeof value === "object") {
      return Object.values(value).some(checkForInjection);
    }

    return false;
  };

  // Check body
  if (req.body && checkForInjection(req.body)) {
    logger.warn("SQL injection attempt detected in request body", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
      body: req.body,
    });

    throw new AppError("Invalid request data", 400);
  }

  // Check query parameters
  if (req.query && checkForInjection(req.query)) {
    logger.warn("SQL injection attempt detected in query parameters", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
      query: req.query,
    });

    throw new AppError("Invalid request data", 400);
  }

  next();
};

/**
 * XSS protection middleware
 */
export const xssProtection = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    /onfocus\s*=/gi,
    /onblur\s*=/gi,
    /onchange\s*=/gi,
    /onsubmit\s*=/gi,
    /onreset\s*=/gi,
    /onselect\s*=/gi,
    /onkeydown\s*=/gi,
    /onkeyup\s*=/gi,
    /onkeypress\s*=/gi,
  ];

  const checkForXSS = (value: any): boolean => {
    if (typeof value === "string") {
      return xssPatterns.some((pattern) => pattern.test(value));
    }

    if (Array.isArray(value)) {
      return value.some(checkForXSS);
    }

    if (value && typeof value === "object") {
      return Object.values(value).some(checkForXSS);
    }

    return false;
  };

  // Check body
  if (req.body && checkForXSS(req.body)) {
    logger.warn("XSS attempt detected in request body", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
      body: req.body,
    });

    throw new AppError("Invalid request data", 400);
  }

  // Check query parameters
  if (req.query && checkForXSS(req.query)) {
    logger.warn("XSS attempt detected in query parameters", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
      query: req.query,
    });

    throw new AppError("Invalid request data", 400);
  }

  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info("HTTP Request", {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      contentLength: res.get("content-length"),
    });
  });

  next();
};
