import cors from "cors";
import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import routes from "./routes/index.js";
import swaggerSpec from "./swagger.js";
import healthRoutes from "./shared/health/health.routes.js";
import { AppError } from "./shared/errors/app.error.js";
import {
  securityMiddleware,
  sanitizeRequest,
  requestSizeLimiter,
  sqlInjectionProtection,
  xssProtection,
} from "./shared/middlewares/security.middleware.js";
import {
  coloredLogger,
  httpLoggerMiddleware,
} from "./shared/logger/colored.logger.js";
import { generalLimiter } from "./shared/middlewares/rate-limit.middleware.js";
import {
  tenantContext,
} from "./shared/middlewares/tenant.middleware.js";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class App {
  public app: Application;

  constructor() {
    this.app = express();

    this.middlewares();
    this.swaggerConfig();
    this.routes();
    this.errorHandling();
  }

  private middlewares(): void {
    // Security middleware (must be first)
    this.app.use(securityMiddleware);

    // Request logging colorido
    this.app.use(httpLoggerMiddleware);

    // Request sanitization
    this.app.use(sanitizeRequest);

    // SQL injection protection
    this.app.use(sqlInjectionProtection);

    // XSS protection
    this.app.use(xssProtection);

    // Request size limiting - 100MB for video uploads
    this.app.use(requestSizeLimiter(100 * 1024 * 1024)); // 100MB

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-ID"],
        credentials: true,
        exposedHeaders: ["Content-Length", "Content-Type"],
      })
    );

    // Body parsing - 100MB for video uploads
    this.app.use(express.json({ limit: "100mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "100mb" }));

    // Serve uploaded files statically with CORS
    this.app.use(
      "/uploads",
      (_req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET");
        res.header("Cross-Origin-Resource-Policy", "cross-origin");
        next();
      },
      express.static(path.resolve(__dirname, "..", "uploads"))
    );

    // Rate limiting
    this.app.use(generalLimiter);
  }

  private swaggerConfig(): void {
    this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  private routes(): void {
    // Health check routes (no auth required)
    this.app.use("/", healthRoutes);

    // API routes with tenant middleware (but skip auth routes)
    this.app.use("/api", tenantContext);
    this.app.use("/api", routes);

    // Apply validateTenantAccess and injectTenantScope only to protected routes
    // This will be handled within individual route files
  }

  private errorHandling(): void {
    // 404 handler
    this.app.use("*", (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        error: "Not Found",
        statusCode: 404,
      });
    });

    // Global error handler
    this.app.use(
      (
        error: Error,
        _req: Request,
        res: Response,
        _next: NextFunction
      ): void => {
        if (error instanceof AppError) {
          res.status(error.statusCode).json({
            success: false,
            message: error.message,
            error: error.name,
            statusCode: error.statusCode,
            ...(process.env.NODE_ENV === "development" && {
              stack: error.stack,
            }),
          });
          return;
        }

        // Handle Zod validation errors
        if (error.name === "ZodError") {
          const zodError = error as any;
          res.status(400).json({
            success: false,
            message: "Dados de entrada inválidos",
            error: "Validation Error",
            statusCode: 400,
            details: zodError.errors || [],
            // Show formatted errors in development
            ...(process.env.NODE_ENV === "development" &&
              zodError.errors && {
                formattedErrors: zodError.errors.map((err: any) => ({
                  field: err.path.join("."),
                  message: err.message,
                  received: err.received,
                })),
              }),
          });
          return;
        }

        // Handle Prisma errors
        if (error.name === "PrismaClientKnownRequestError") {
          const prismaError = error as any;

          if (prismaError.code === "P2002") {
            res.status(409).json({
              success: false,
              message: "Recurso já existe",
              error: "Conflict",
              statusCode: 409,
            });
            return;
          }

          if (prismaError.code === "P2025") {
            res.status(404).json({
              success: false,
              message: "Recurso não encontrado",
              error: "Not Found",
              statusCode: 404,
            });
            return;
          }
        }

        // Handle JWT errors
        if (error.name === "JsonWebTokenError") {
          res.status(401).json({
            success: false,
            message: "Token inválido",
            error: "Unauthorized",
            statusCode: 401,
          });
          return;
        }

        if (error.name === "TokenExpiredError") {
          res.status(401).json({
            success: false,
            message: "Token expirado",
            error: "Unauthorized",
            statusCode: 401,
          });
          return;
        }

        // Default error handler
        coloredLogger.logError("Unhandled error:", error);

        res.status(500).json({
          success: false,
          message: "Erro interno do servidor",
          error: "Internal Server Error",
          statusCode: 500,
          ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
            details: error.message,
          }),
        });
      }
    );
  }
}

export default new App().app;
