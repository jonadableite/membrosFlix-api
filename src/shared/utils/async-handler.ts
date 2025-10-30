import type { Request, Response, NextFunction } from "express";
import type { AsyncHandler } from '../../core/types/common.types.js';

export const asyncHandler = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
