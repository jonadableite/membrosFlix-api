import type { Request, Response } from "express";
import { BaseController } from '../../../core/base/base.controller.js';
import { AppError } from '../../../shared/errors/app.error.js';
import { asyncHandler } from '../../../shared/utils/async-handler.js';
import type {
  AuthenticatedRequest,
  ApiResponse,
} from '../../../core/types/common.types.js';
import type { PaginatedResponse } from '../../../core/interfaces/base.interface.js';
import type { Curso } from "@prisma/client";
import type { CourseService } from '../services/course.service.js';
import { UploadService } from '../../../modules/uploads/services/upload.service.js';
import {
  createCourseSchema,
  updateCourseSchema,
  courseQuerySchema,
  type CreateCourseDto,
  type UpdateCourseDto,
  type CourseResponseDto,
  type CourseWithLessonsDto,
  type CourseStatsDto,
} from '../dtos/course.dto.js';

export class CourseController extends BaseController<Curso> {
  private uploadService: UploadService;

  constructor(private courseService: CourseService) {
    super(courseService, "Course");
    this.uploadService = new UploadService();
  }

  // Override base methods with course-specific logic
  override store = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      // Process uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Build course data from form fields
      const courseData: any = {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status || "DRAFT",
      };

      // Add optional fields if present
      if (req.body.duracaoTotal) {
        courseData.duracaoTotal = Number(req.body.duracaoTotal);
      }
      if (req.body.price) {
        courseData.price = Number(req.body.price);
      }
      if (req.body.category) {
        courseData.category = req.body.category;
      }
      if (req.body.level) {
        courseData.level = req.body.level;
      }
      if (req.body.tags) {
        courseData.tags = JSON.parse(req.body.tags);
      }

      // Upload files to MinIO (falls back to local if MinIO unavailable)
      if (files?.thumbnail?.[0]) {
        const thumbnailFile = files.thumbnail[0];
        try {
          courseData.thumbnail = await this.uploadService.uploadFile(
            thumbnailFile,
            "curso-thumbnails"
          );
        } catch (error) {
          // Fallback: save locally if MinIO fails
          console.warn("MinIO unavailable, using local storage");
          const fs = await import("fs/promises");
          const path = await import("path");
          const uploadDir = path.resolve(process.cwd(), "uploads");
          await fs.mkdir(uploadDir, { recursive: true });
          const fileName = `${Date.now()}-${thumbnailFile.originalname}`;
          await fs.writeFile(
            path.join(uploadDir, fileName),
            thumbnailFile.buffer
          );
          courseData.thumbnail = `/uploads/${fileName}`;
        }
      }
      if (files?.file?.[0]) {
        const videoFile = files.file[0];
        try {
          courseData.path = await this.uploadService.uploadFile(
            videoFile,
            "curso-videos"
          );
        } catch (error) {
          // Fallback: save locally if MinIO fails
          console.warn("MinIO unavailable, using local storage");
          const fs = await import("fs/promises");
          const path = await import("path");
          const uploadDir = path.resolve(process.cwd(), "uploads");
          await fs.mkdir(uploadDir, { recursive: true });
          const fileName = `${Date.now()}-${videoFile.originalname}`;
          await fs.writeFile(path.join(uploadDir, fileName), videoFile.buffer);
          courseData.path = `/uploads/${fileName}`;
        }
      }

      // Add tenantId from request context
      courseData.tenantId = (req as any).tenantId;

      // Validate processed data
      const validatedData = createCourseSchema.parse(courseData);

      // Set instructor ID logic:
      // - If user is INSTRUCTOR and no instructorId specified, use their ID
      // - If user is ADMIN, check if they are also an instructor
      if (!validatedData.instructorId && req.user?.role === "INSTRUCTOR") {
        validatedData.instructorId = Number(req.user.id);
      } else if (!validatedData.instructorId && req.user?.role === "ADMIN") {
        // Para admin, usar um instructorId padrão ou pular esta validação
        // TODO: Implementar lógica adequada para admin criar cursos
        console.warn("Admin criando curso sem instructorId específico");
      }

      const course = await this.courseService.createCourse(validatedData);

      const response: ApiResponse<CourseResponseDto> = {
        success: true,
        message: "Curso criado com sucesso",
        data: course,
      };

      res.status(201).json(response);
    }
  );

  override index = asyncHandler(async (req: Request, res: Response) => {
    const query = courseQuerySchema.parse(req.query);

    const { courses, total, pages } =
      await this.courseService.findCoursesWithFilters(query);

    const response: PaginatedResponse<CourseResponseDto> = {
      success: true,
      message: "Cursos listados com sucesso",
      data: courses,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: pages,
      },
    };

    res.status(200).json(response);
  });

  override show = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { includeLessons } = req.query;

    let course: CourseResponseDto | CourseWithLessonsDto;

    if (includeLessons === "true") {
      course = await this.courseService.findCourseWithLessons(Number(id));
    } else {
      const foundCourse = await this.courseService.findById(Number(id));
      if (!foundCourse) {
        throw AppError.notFound("Curso não encontrado");
      }
      course = this.courseService.toResponseDto(foundCourse);
    }

    const response: ApiResponse<CourseResponseDto | CourseWithLessonsDto> = {
      success: true,
      message: "Curso encontrado com sucesso",
      data: course,
    };

    res.status(200).json(response);
  });

  override update = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      // Process uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Build update data from form fields
      const updateData: any = {};

      if (req.body.title) updateData.title = req.body.title;
      if (req.body.description !== undefined)
        updateData.description = req.body.description;
      if (req.body.status) updateData.status = req.body.status;
      if (req.body.duracaoTotal)
        updateData.duracaoTotal = Number(req.body.duracaoTotal);
      if (req.body.price) updateData.price = Number(req.body.price);
      if (req.body.category) updateData.category = req.body.category;
      if (req.body.level) updateData.level = req.body.level;
      if (req.body.tags) updateData.tags = JSON.parse(req.body.tags);

      // Upload files to MinIO (falls back to local if MinIO unavailable)
      if (files?.thumbnail?.[0]) {
        const thumbnailFile = files.thumbnail[0];
        try {
          updateData.thumbnail = await this.uploadService.uploadFile(
            thumbnailFile,
            "curso-thumbnails"
          );
        } catch (error) {
          // Fallback: save locally if MinIO fails
          console.warn("MinIO unavailable, using local storage");
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
      if (files?.file?.[0]) {
        const videoFile = files.file[0];
        try {
          updateData.path = await this.uploadService.uploadFile(
            videoFile,
            "curso-videos"
          );
        } catch (error) {
          // Fallback: save locally if MinIO fails
          console.warn("MinIO unavailable, using local storage");
          const fs = await import("fs/promises");
          const path = await import("path");
          const uploadDir = path.resolve(process.cwd(), "uploads");
          await fs.mkdir(uploadDir, { recursive: true });
          const fileName = `${Date.now()}-${videoFile.originalname}`;
          await fs.writeFile(path.join(uploadDir, fileName), videoFile.buffer);
          updateData.path = `/uploads/${fileName}`;
        }
      }

      const validatedData = updateCourseSchema.parse(updateData);

      // Check if user has permission to update this course
      if (req.user?.role !== "ADMIN") {
        const course = await this.courseService.findById(Number(id));
        if (!course || course.instructorId !== Number(req.user?.id)) {
          throw AppError.forbidden(
            "Você não tem permissão para editar este curso"
          );
        }
      }

      const updatedCourse = await this.courseService.updateCourse(
        Number(id),
        validatedData
      );

      const response: ApiResponse<CourseResponseDto> = {
        success: true,
        message: "Curso atualizado com sucesso",
        data: updatedCourse,
      };

      res.status(200).json(response);
    }
  );

  // Course-specific endpoints
  publish = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check permissions
    if (req.user?.role !== "ADMIN") {
      const course = await this.courseService.findById(Number(id));
      if (!course || course.instructorId !== Number(req.user?.id)) {
        throw AppError.forbidden(
          "Você não tem permissão para publicar este curso"
        );
      }
    }

    const publishedCourse = await this.courseService.publishCourse(Number(id));

    const response: ApiResponse<CourseResponseDto> = {
      success: true,
      message: "Curso publicado com sucesso",
      data: publishedCourse,
    };

    res.status(200).json(response);
  });

  archive = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check permissions
    if (req.user?.role !== "ADMIN") {
      const course = await this.courseService.findById(Number(id));
      if (!course || course.instructorId !== Number(req.user?.id)) {
        throw AppError.forbidden(
          "Você não tem permissão para arquivar este curso"
        );
      }
    }

    const archivedCourse = await this.courseService.archiveCourse(Number(id));

    const response: ApiResponse<CourseResponseDto> = {
      success: true,
      message: "Curso arquivado com sucesso",
      data: archivedCourse,
    };

    res.status(200).json(response);
  });

  enroll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!req.user) {
      throw AppError.unauthorized("Usuário não autenticado");
    }

    // If no studentId provided, enroll current user
    const targetStudentId = studentId || req.user.id;

    // Only admins can enroll other users
    if (targetStudentId !== req.user.id && req.user.role !== "ADMIN") {
      throw AppError.forbidden(
        "Você não tem permissão para inscrever outros usuários"
      );
    }

    await this.courseService.enrollStudent(Number(id), targetStudentId);

    const response: ApiResponse<null> = {
      success: true,
      message: "Inscrição realizada com sucesso",
      data: null,
    };

    res.status(200).json(response);
  });

  unenroll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!req.user) {
      throw AppError.unauthorized("Usuário não autenticado");
    }

    // If no studentId provided, unenroll current user
    const targetStudentId = studentId || req.user.id;

    // Only admins can unenroll other users
    if (targetStudentId !== req.user.id && req.user.role !== "ADMIN") {
      throw AppError.forbidden(
        "Você não tem permissão para desinscrever outros usuários"
      );
    }

    await this.courseService.unenrollStudent(Number(id), targetStudentId);

    const response: ApiResponse<null> = {
      success: true,
      message: "Desinscrito com sucesso",
      data: null,
    };

    res.status(200).json(response);
  });

  getInstructorCourses = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { instructorId } = req.params;
      const query = courseQuerySchema.parse(req.query);

      // Check permissions
      if (req.user?.role !== "ADMIN" && req.user?.id !== instructorId) {
        throw AppError.forbidden(
          "Você não tem permissão para ver os cursos deste instrutor"
        );
      }

      const options = {
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder } as any,
      };

      const courses = await this.courseService.findCoursesByInstructor(
        Number(instructorId),
        options
      );

      const response: ApiResponse<CourseResponseDto[]> = {
        success: true,
        message: "Cursos do instrutor listados com sucesso",
        data: courses,
      };

      res.status(200).json(response);
    }
  );

  getStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Only admins can view global stats
    if (req.user?.role !== "ADMIN") {
      throw AppError.forbidden("Acesso negado");
    }

    const stats = await this.courseService.getCourseStats();

    const response: ApiResponse<CourseStatsDto> = {
      success: true,
      message: "Estatísticas obtidas com sucesso",
      data: stats,
    };

    res.status(200).json(response);
  });

  getInstructorStats = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { instructorId } = req.params;

      // Check permissions
      if (req.user?.role !== "ADMIN" && req.user?.id !== instructorId) {
        throw AppError.forbidden(
          "Você não tem permissão para ver as estatísticas deste instrutor"
        );
      }

      const stats = await this.courseService.getInstructorStats(
        Number(instructorId)
      );

      const response: ApiResponse<any> = {
        success: true,
        message: "Estatísticas do instrutor obtidas com sucesso",
        data: stats,
      };

      res.status(200).json(response);
    }
  );

  // Override base validation methods
  protected override async validateCreateData(
    req: Request
  ): Promise<CreateCourseDto> {
    return createCourseSchema.parse(req.body);
  }

  protected override async validateUpdateData(
    req: Request
  ): Promise<UpdateCourseDto> {
    return updateCourseSchema.parse(req.body);
  }
}
