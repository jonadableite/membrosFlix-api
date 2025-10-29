import { Response, NextFunction } from "express";
import { AppError } from "@/shared/errors/app.error";
import logger from "@/shared/logger/logger";
import type { AuthenticatedRequest } from "@/core/types/common.types";

export interface TenantRequest extends AuthenticatedRequest {
  tenantId?: string;
}

/**
 * Middleware to extract tenant context from request
 * Supports multiple strategies:
 * 1. Subdomain-based (e.g., tenant1.membrosflix.com)
 * 2. Header-based (X-Tenant-ID)
 * 3. JWT token tenantId
 */
export const tenantContext = (
  req: TenantRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Skip tenant context for auth routes
    const authRoutes = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh-token'];
    if (authRoutes.includes(req.path)) {
      return next();
    }

    let tenantId: string | undefined;

    // Strategy 1: Extract from subdomain
    const host = req.get("host");
    if (host) {
      const subdomain = host.split(".")[0];
      if (subdomain && subdomain !== "www" && subdomain !== "api") {
        tenantId = subdomain;
      }
    }

    // Strategy 2: Extract from header
    if (!tenantId) {
      tenantId = req.get("X-Tenant-ID") || req.get("x-tenant-id");
    }

    // Strategy 3: Extract from JWT token (if user is authenticated)
    if (!tenantId && req.user?.tenantId) {
      tenantId = req.user.tenantId;
    }

    // Strategy 4: Default tenant for development
    if (!tenantId && process.env.NODE_ENV === "development") {
      tenantId = process.env.DEFAULT_TENANT_ID || "default-tenant";
    }

    if (!tenantId) {
      logger.warn("No tenant context found in request", {
        host: req.get("host"),
        userAgent: req.get("user-agent"),
        ip: req.ip,
      });
      throw new AppError("Tenant context required", 400);
    }

    req.tenantId = tenantId;

    logger.debug("Tenant context set", {
      tenantId,
      userId: req.user?.id,
      path: req.path,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate tenant access
 * Ensures user can only access resources within their tenant
 */
export const validateTenantAccess = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  try {
    // Skip validation for auth routes
    const authRoutes = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh-token'];
    if (authRoutes.includes(req.path)) {
      return next();
    }

    // Skip validation if no tenant ID is required
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context is required',
        error: 'Bad Request',
        statusCode: 400
      });
    }

    // If user is authenticated, validate they belong to the tenant
    if (req.user && req.user.tenantId !== req.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: User does not belong to this tenant',
        error: 'Forbidden',
        statusCode: 403
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to inject tenant context into all database queries
 * This ensures all Prisma queries are automatically scoped to the tenant
 */
export const injectTenantScope = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.tenantId) {
    return next();
  }

  // Store original Prisma client
  const originalPrisma = req.app.locals.prisma;

  // Create tenant-scoped Prisma client
  req.app.locals.prisma = originalPrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({
          model,
          operation: _operation,
          args,
          query,
        }: any) {
          // Add tenantId to where clauses for multi-tenant models
          const tenantModels = [
            "User",
            "Curso",
            "Aula",
            "Instructor",
            "Notification",
          ];

          if (tenantModels.includes(model) && args.where) {
            args.where.tenantId = req.tenantId;
          }

          return query(args);
        },
      },
    },
  });

  // Restore original Prisma client after request
  res.on("finish", () => {
    req.app.locals.prisma = originalPrisma;
  });

  next();
};
