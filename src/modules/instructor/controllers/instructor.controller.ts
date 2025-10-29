import type { Request, Response, NextFunction } from "express";
import { InstructorService } from "../services/instructor.service";
import { InstructorRepository } from "../repositories/instructor.repository";
import {
  createInstructorSchema,
  updateInstructorSchema,
} from "../dtos/instructor.dto";
import { ZodError } from "zod";

export class InstructorController {
  private instructorService: InstructorService;

  constructor() {
    const instructorRepository = new InstructorRepository();
    this.instructorService = new InstructorService(instructorRepository);
  }

  /**
   * List all instructors
   * GET /api/v1/instructors
   */
  index = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const tenantId = (req as any).tenantId;
      const instructors =
        await this.instructorService.listInstructors(tenantId);

      return res.status(200).json({
        success: true,
        data: instructors,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get instructor by ID
   * GET /api/v1/instructors/:id
   */
  show = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const tenantId = (req as any).tenantId;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
          error: "Bad Request",
          statusCode: 400,
        });
      }

      const instructor = await this.instructorService.getInstructor(
        id,
        tenantId
      );

      return res.status(200).json({
        success: true,
        data: instructor,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create instructor
   * POST /api/v1/instructors
   */
  store = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const tenantId = (req as any).tenantId;

      // Validate request body
      const validatedData = createInstructorSchema.parse(req.body);

      const instructor = await this.instructorService.createInstructor(
        validatedData,
        tenantId
      );

      return res.status(201).json({
        success: true,
        data: instructor,
        message: "Instrutor criado com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados de entrada inválidos",
          error: "Validation Error",
          statusCode: 400,
          details: error.errors,
        });
      }
      next(error);
    }
  };

  /**
   * Update instructor
   * PUT /api/v1/instructors/:id
   */
  update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const tenantId = (req as any).tenantId;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
          error: "Bad Request",
          statusCode: 400,
        });
      }

      // Validate request body
      const validatedData = updateInstructorSchema.parse(req.body);

      const instructor = await this.instructorService.updateInstructor(
        id,
        validatedData,
        tenantId
      );

      return res.status(200).json({
        success: true,
        data: instructor,
        message: "Instrutor atualizado com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados de entrada inválidos",
          error: "Validation Error",
          statusCode: 400,
          details: error.errors,
        });
      }
      next(error);
    }
  };

  /**
   * Delete instructor
   * DELETE /api/v1/instructors/:id
   */
  destroy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const tenantId = (req as any).tenantId;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
          error: "Bad Request",
          statusCode: 400,
        });
      }

      await this.instructorService.deleteInstructor(id, tenantId);

      return res.status(200).json({
        success: true,
        message: "Instrutor removido com sucesso",
      });
    } catch (error) {
      next(error);
    }
  };
}
