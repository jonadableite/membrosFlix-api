import type { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { asyncHandler } from "../../../shared/utils/async-handler";
import type {
  AuthenticatedRequest,
  ApiResponse,
} from "../../../core/types/common.types";
import type { PaginatedResponse } from "../../../core/interfaces/base.interface";
// Corrigido: importação correta do tipo Aula ao invés de tentar importar de prisma
import type { Aula } from "@prisma/client";
import type { LessonService } from "../services/lesson.service";
import { UploadService } from "../../../modules/uploads/services/upload.service";
import {
  createLessonSchema,
  updateLessonSchema,
  lessonQuerySchema,
  reorderLessonsSchema,
  type CreateLessonDto,
  type UpdateLessonDto,
  type LessonQueryDto,
  type ReorderLessonsDto,
} from "../dtos/lesson.dto";

export class LessonController extends BaseController<Aula> {
  private uploadService: UploadService;

  constructor(private lessonService: LessonService) {
    super(lessonService, "Lesson");
    this.uploadService = new UploadService();
  }

  private validateId(id: string | undefined): string {
    if (!id) {
      throw new Error("ID é obrigatório");
    }
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      throw new Error("ID deve ser um número válido");
    }
    return id;
  }

  /**
   * Create a new lesson
   * POST /lessons OR POST /courses/:courseId/lessons
   */
  override store = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      // Get courseId from URL params if available (nested route), otherwise from body
      const courseIdFromParams = req.params.courseId;
      const bodyData = {
        ...req.body,
        ...(courseIdFromParams && { courseId: courseIdFromParams }),
      };

      const data = createLessonSchema.parse(bodyData) as CreateLessonDto;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Process file uploads
      const lessonData: any = { ...data };

      // Upload video if provided
      if (files?.video?.[0]) {
        const videoFile = files.video[0];
        console.log(
          `✅ Arquivo de vídeo aceito: ${videoFile.originalname}, mimetype: ${videoFile.mimetype}`
        );
        try {
          lessonData.path = await this.uploadService.uploadFile(
            videoFile,
            "aula-videos"
          );
          lessonData.videoUrl = lessonData.path; // Also set videoUrl for compatibility
        } catch (error) {
          console.warn("MinIO unavailable for video, using local storage");
          // Fallback to local storage
          const fs = await import("fs/promises");
          const path = await import("path");
          const uploadDir = path.resolve(process.cwd(), "uploads");
          await fs.mkdir(uploadDir, { recursive: true });
          const fileName = `${Date.now()}-${videoFile.originalname}`;
          await fs.writeFile(path.join(uploadDir, fileName), videoFile.buffer);
          lessonData.path = `/uploads/${fileName}`;
          lessonData.videoUrl = lessonData.path;
        }
      }

      // Upload thumbnail if provided
      if (files?.thumbnail?.[0]) {
        const thumbnailFile = files.thumbnail[0];
        console.log(
          `✅ Arquivo de thumbnail aceito: ${thumbnailFile.originalname}, mimetype: ${thumbnailFile.mimetype}`
        );
        try {
          lessonData.thumbnail = await this.uploadService.uploadFile(
            thumbnailFile,
            "aula-thumbnails"
          );
        } catch (error) {
          console.warn("MinIO unavailable for thumbnail, using local storage");
          // Fallback to local storage
          const fs = await import("fs/promises");
          const path = await import("path");
          const uploadDir = path.resolve(process.cwd(), "uploads");
          await fs.mkdir(uploadDir, { recursive: true });
          const fileName = `${Date.now()}-${thumbnailFile.originalname}`;
          await fs.writeFile(
            path.join(uploadDir, fileName),
            thumbnailFile.buffer
          );
          lessonData.thumbnail = `/uploads/${fileName}`;
        }
      }

      // If no instructor specified, use the authenticated user (must be instructor)
      if (!lessonData.instructorId && req.user?.role === "INSTRUCTOR") {
        lessonData.instructorId = req.user.id;
      }

      const lesson = await this.lessonService.createLesson(lessonData);

      const response: ApiResponse<any> = {
        success: true,
        message: "Aula criada com sucesso",
        data: lesson,
      };

      res.status(201).json(response);
    }
  );

  /**
   * List lessons with filters
   * GET /lessons
   */
  override index = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const query = lessonQuerySchema.parse(req.query) as LessonQueryDto;
      const { lessons, total, pages } =
        await this.lessonService.findLessonsWithFilters(query);

      const response: PaginatedResponse<any> = {
        success: true,
        message: "Aulas listadas com sucesso",
        data: lessons,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: pages,
        },
      };

      res.status(200).json(response);
    }
  );

  /**
   * Get lesson by ID
   * GET /lessons/:id
   */
  override show = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const { includeProgress } = req.query;

      let lesson: any;

      if (includeProgress === "true") {
        // Need userId for progress, using a default for now
        lesson = await this.lessonService.findLessonWithProgress(
          this.validateId(id),
          ""
        );
      } else {
        lesson = await this.lessonService.findById(this.validateId(id));
        if (!lesson) {
          res.status(404).json({
            success: false,
            message: "Aula não encontrada",
            error: "Not Found",
            statusCode: 404,
          });
          return;
        }
      }

      const response: ApiResponse<any> = {
        success: true,
        message: "Aula encontrada com sucesso",
        data: lesson,
      };

      res.status(200).json(response);
    }
  );

  /**
   * Update lesson
   * PUT /lessons/:id OR PUT /courses/:courseId/lessons/:id
   */
  override update = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { id } = req.params;

      // Get courseId from URL params if available (nested route)
      const courseIdFromParams = req.params.courseId;
      const bodyData = {
        ...req.body,
        ...(courseIdFromParams && { courseId: courseIdFromParams }),
      };

      const data = updateLessonSchema.parse(bodyData) as UpdateLessonDto;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Process file uploads
      const updateData: any = { ...data };

      // Upload video if provided
      if (files?.video?.[0]) {
        const videoFile = files.video[0];
        console.log(
          `✅ Arquivo de vídeo aceito: ${videoFile.originalname}, mimetype: ${videoFile.mimetype}`
        );
        try {
          updateData.path = await this.uploadService.uploadFile(
            videoFile,
            "aula-videos"
          );
          updateData.videoUrl = updateData.path;
        } catch (error) {
          console.warn("MinIO unavailable for video, using local storage");
          const fs = await import("fs/promises");
          const path = await import("path");
          const uploadDir = path.resolve(process.cwd(), "uploads");
          await fs.mkdir(uploadDir, { recursive: true });
          const fileName = `${Date.now()}-${videoFile.originalname}`;
          await fs.writeFile(path.join(uploadDir, fileName), videoFile.buffer);
          updateData.path = `/uploads/${fileName}`;
          updateData.videoUrl = updateData.path;
        }
      }

      // Upload thumbnail if provided
      if (files?.thumbnail?.[0]) {
        const thumbnailFile = files.thumbnail[0];
        console.log(
          `✅ Arquivo de thumbnail aceito: ${thumbnailFile.originalname}, mimetype: ${thumbnailFile.mimetype}`
        );
        try {
          updateData.thumbnail = await this.uploadService.uploadFile(
            thumbnailFile,
            "aula-thumbnails"
          );
        } catch (error) {
          console.warn("MinIO unavailable for thumbnail, using local storage");
          const fs = await import("fs/promises");
          const path = await import("path");
          const uploadDir = path.resolve(process.cwd(), "uploads");
          await fs.mkdir(uploadDir, { recursive: true });
          const fileName = `${Date.now()}-${thumbnailFile.originalname}`;
          await fs.writeFile(
            path.join(uploadDir, fileName),
            thumbnailFile.buffer
          );
          updateData.thumbnail = `/uploads/${fileName}`;
        }
      }

      const lesson = await this.lessonService.updateLesson(
        this.validateId(id),
        updateData
      );

      const response: ApiResponse<any> = {
        success: true,
        message: "Aula atualizada com sucesso",
        data: lesson,
      };

      res.status(200).json(response);
    }
  );

  /**
   * Delete lesson
   * DELETE /lessons/:id
   */
  override destroy = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      await this.lessonService.delete(this.validateId(id));

      const response: ApiResponse<null> = {
        success: true,
        message: "Aula excluída com sucesso",
        data: null,
      };

      res.status(200).json(response);
    }
  );

  /**
   * Get lessons by course
   * GET /courses/:courseId/lessons
   */
  getLessonsByCourse = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const courseId = this.validateId(req.params.courseId);
      const query = lessonQuerySchema.parse(req.query) as LessonQueryDto;

      const lessons = await this.lessonService.findLessonsByCourse(courseId);
      const total = lessons.length;
      const pages = Math.ceil(total / query.limit);

      const response: PaginatedResponse<any> = {
        success: true,
        message: "Aulas do curso listadas com sucesso",
        data: lessons,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: pages,
        },
      };

      res.status(200).json(response);
    }
  );

  /**
   * Get lessons by instructor
   * GET /instructors/:instructorId/lessons
   */
  getLessonsByInstructor = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const instructorId = this.validateId(req.params.instructorId);
      const query = lessonQuerySchema.parse(req.query) as LessonQueryDto;

      const lessons =
        await this.lessonService.findLessonsByInstructor(instructorId);
      const total = lessons.length;
      const pages = Math.ceil(total / query.limit);

      const response: PaginatedResponse<any> = {
        success: true,
        message: "Aulas do instrutor listadas com sucesso",
        data: lessons,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: pages,
        },
      };

      res.status(200).json(response);
    }
  );

  /**
   * Reorder lessons in a course
   * PUT /courses/:courseId/lessons/reorder
   */
  reorderLessons = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const courseId = this.validateId(req.params.courseId);
      const data = reorderLessonsSchema.parse(req.body) as ReorderLessonsDto;

      await this.lessonService.reorderLessons(courseId, data);

      const response: ApiResponse<null> = {
        success: true,
        message: "Ordem das aulas atualizada com sucesso",
        data: null,
      };

      res.status(200).json(response);
    }
  );

  /**
   * Publish lesson
   * PUT /lessons/:id/publish
   */
  publish = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const id = this.validateId(req.params.id);
      const lesson = await this.lessonService.publish(id);

      const response: ApiResponse<any> = {
        success: true,
        message: "Aula publicada com sucesso",
        data: lesson,
      };

      res.status(200).json(response);
    }
  );

  /**
   * Archive lesson
   * PUT /lessons/:id/archive
   */
  archive = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const id = this.validateId(req.params.id);
      const lesson = await this.lessonService.archive(id);

      const response: ApiResponse<any> = {
        success: true,
        message: "Aula arquivada com sucesso",
        data: lesson,
      };

      res.status(200).json(response);
    }
  );

  /**
   * Mark lesson as watched
   * POST /lessons/:id/watch
   */
  markAsWatched = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const id = this.validateId(req.params.id);
      const userId = req.user!.id;

      await this.lessonService.markAsWatched(id, userId, 0);

      const response: ApiResponse<null> = {
        success: true,
        message: "Aula marcada como assistida",
        data: null,
      };

      res.status(200).json(response);
    }
  );

  /**
   * Mark lesson as completed
   * POST /lessons/:id/complete
   */
  markAsCompleted = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const id = this.validateId(req.params.id);
      const userId = req.user!.id;

      await this.lessonService.markAsCompleted(id, userId);

      const response: ApiResponse<null> = {
        success: true,
        message: "Aula marcada como concluída",
        data: null,
      };

      res.status(200).json(response);
    }
  );

  /**
   * Get lesson statistics
   * GET /lessons/:id/stats
   */
  getStats = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const id = this.validateId(req.params.id);
      const stats = await this.lessonService.getStats(id);

      const response: ApiResponse<any> = {
        success: true,
        message: "Estatísticas da aula obtidas com sucesso",
        data: stats,
      };

      res.status(200).json(response);
    }
  );

  /**
   * Get course lesson statistics
   * GET /courses/:courseId/lessons/stats
   */
  getCourseStats = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const courseId = this.validateId(req.params.courseId);
      const stats = await this.lessonService.getCourseStats(courseId);

      const response: ApiResponse<any> = {
        success: true,
        message: "Estatísticas das aulas do curso obtidas com sucesso",
        data: stats,
      };

      res.status(200).json(response);
    }
  );

  // Override base validation methods
  protected override async validateCreateData(
    req: Request
  ): Promise<CreateLessonDto> {
    return createLessonSchema.parse(req.body);
  }

  protected override async validateUpdateData(
    req: Request
  ): Promise<UpdateLessonDto> {
    return updateLessonSchema.parse(req.body);
  }
}
