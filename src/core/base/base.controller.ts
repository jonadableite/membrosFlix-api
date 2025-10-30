import type { Request, Response } from "express";
import type {
  BaseEntity,
  Service,
  ApiResponse,
  PaginatedResponse,
} from '../../core/interfaces/base.interface.js';
import type { PaginationParams } from '../../core/types/common.types.js';
import { AppError } from '../../shared/errors/app.error.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

export abstract class BaseController<T extends BaseEntity> {
  protected service: Service<T>;
  protected entityName: string;

  constructor(service: Service<T>, entityName: string) {
    this.service = service;
    this.entityName = entityName;
  }

  index = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const {
        page = 1,
        limit = 10,
        sortBy,
        sortOrder = "desc",
      } = req.query as PaginationParams;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" };

      const [items, total] = await Promise.all([
        this.service.findMany({
          skip,
          take,
          orderBy: orderBy as any,
        }),
        this.getTotalCount(req),
      ]);

      const response: PaginatedResponse<T> = {
        success: true,
        data: items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };

      return res.json(response);
    }
  );

  show = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const { id } = req.params;

      if (!id) {
        throw new AppError("ID parameter is required", 400);
      }

      const item = await this.service.findById(id);

      if (!item) {
        throw new AppError(`${this.entityName} not found`, 404);
      }

      const response: ApiResponse<T> = {
        success: true,
        data: item,
      };

      return res.json(response);
    }
  );

  store = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const data = await this.validateCreateData(req);

      const item = await this.service.create(data);

      const response: ApiResponse<T> = {
        success: true,
        data: item,
        message: `${this.entityName} created successfully`,
      };

      return res.status(201).json(response);
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const { id } = req.params;

      if (!id) {
        throw new AppError("ID parameter is required", 400);
      }

      const data = await this.validateUpdateData(req);

      const item = await this.service.update(id, data);

      const response: ApiResponse<T> = {
        success: true,
        data: item,
        message: `${this.entityName} updated successfully`,
      };

      return res.json(response);
    }
  );

  destroy = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const { id } = req.params;

      if (!id) {
        throw new AppError("ID parameter is required", 400);
      }

      await this.service.delete(id);

      const response: ApiResponse = {
        success: true,
        message: `${this.entityName} deleted successfully`,
      };

      return res.json(response);
    }
  );

  protected abstract validateCreateData(req: Request): Promise<any>;
  protected abstract validateUpdateData(req: Request): Promise<any>;

  protected async getTotalCount(_req: Request): Promise<number> {
    // Override in child classes for filtered counts
    const items = await this.service.findMany();
    return items.length;
  }
}
