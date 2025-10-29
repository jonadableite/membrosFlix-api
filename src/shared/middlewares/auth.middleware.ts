import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@/shared/errors/app.error";
import { env } from "@/config/env";
import type {
  AuthenticatedRequest,
  JwtPayload,
  UserRole,
} from "@/core/types/common.types";

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized("Token de acesso não fornecido");
    }

    const token = authHeader.substring(7);

    try {
      const payload = jwt.verify(
        token,
        env.JWT_SECRET as string
      ) as JwtPayload & { type: string };

      if (payload.type !== "access") {
        throw AppError.unauthorized("Tipo de token inválido");
      }

      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized("Token expirado");
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        throw AppError.unauthorized("Token inválido");
      }
      throw jwtError;
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(AppError.unauthorized("Usuário não autenticado"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden("Acesso negado. Permissões insuficientes")
      );
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const payload = jwt.verify(
        token,
        env.JWT_SECRET as string
      ) as JwtPayload & { type: string };

      if (payload.type === "access") {
        req.user = {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          tenantId: payload.tenantId,
        };
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};
