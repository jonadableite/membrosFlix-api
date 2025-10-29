import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { AppError } from "@/shared/errors/app.error";

// General rate limiter - Increased limits for development
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased from 100)
  message: {
    success: false,
    message: "Muitas requisições deste IP, tente novamente em 15 minutos.",
    error: "Too Many Requests",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new AppError(
      "Muitas requisições deste IP, tente novamente em 15 minutos.",
      429
    );
  },
});

// Strict rate limiter for auth endpoints - Increased limits for development
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (increased from 5)
  message: {
    success: false,
    message: "Muitas tentativas de login, tente novamente em 15 minutos.",
    error: "Too Many Requests",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (_req: Request, _res: Response) => {
    throw new AppError(
      "Muitas tentativas de login, tente novamente em 15 minutos.",
      429
    );
  },
});

// Rate limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: "Muitas tentativas de reset de senha, tente novamente em 1 hora.",
    error: "Too Many Requests",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new AppError(
      "Muitas tentativas de reset de senha, tente novamente em 1 hora.",
      429
    );
  },
});

// Rate limiter for course creation (instructors)
export const courseCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 course creations per hour
  message: {
    success: false,
    message: "Muitas criações de curso, tente novamente em 1 hora.",
    error: "Too Many Requests",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new AppError(
      "Muitas criações de curso, tente novamente em 1 hora.",
      429
    );
  },
});
