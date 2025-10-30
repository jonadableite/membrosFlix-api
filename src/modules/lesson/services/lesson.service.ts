import type { Aula } from "@prisma/client";
import { BaseService } from "@/core/base/base.service";
import { AppError } from "@/shared/errors/app.error";
import type {
  Service,
  FindManyOptions,
  CreateData,
  UpdateData,
} from "@/core/interfaces/base.interface";
import type { LessonRepository } from "../repositories/lesson.repository";
import type { CourseRepository } from "@/modules/course/repositories/course.repository";
import type {
  CreateLessonDto,
  UpdateLessonDto,
  LessonQueryDto,
  LessonResponseDto,
  LessonWithProgressDto,
  LessonStatsDto,
  CourseLessonsDto,
  ReorderLessonsDto,
} from "../dtos/lesson.dto";
import {
  createLessonSchema,
  updateLessonSchema,
  reorderLessonsSchema,
} from "../dtos/lesson.dto";
import { eventEmitter, AppEventEmitter } from "@/shared/events/event.emitter";
import logger from "@/shared/logger/logger";

export interface LessonService extends Service<Aula> {
  createLesson(data: CreateLessonDto): Promise<LessonResponseDto>;
  updateLesson(id: string, data: UpdateLessonDto): Promise<LessonResponseDto>;
  findLessonsByCourse(
    courseId: string,
    options?: FindManyOptions<Aula>
  ): Promise<LessonResponseDto[]>;
  findLessonsByInstructor(
    instructorId: string,
    options?: FindManyOptions<Aula>
  ): Promise<LessonResponseDto[]>;
  findLessonWithProgress(
    lessonId: string,
    userId: string
  ): Promise<LessonWithProgressDto>;
  findLessonsWithFilters(
    query: LessonQueryDto
  ): Promise<{ lessons: LessonResponseDto[]; total: number; pages: number }>;
  reorderLessons(courseId: string, data: ReorderLessonsDto): Promise<void>;
  publishLesson(id: string): Promise<LessonResponseDto>;
  archiveLesson(id: string): Promise<LessonResponseDto>;
  markAsWatched(
    lessonId: string,
    userId: string,
    watchTime: number
  ): Promise<void>;
  markAsCompleted(lessonId: string, userId: string): Promise<void>;
  getLessonStats(): Promise<LessonStatsDto>;
  getCourseStats(courseId: string): Promise<CourseLessonsDto>;
  toResponseDto(lesson: Aula & any): LessonResponseDto;
  // Additional methods for compatibility
  publish(id: string): Promise<LessonResponseDto>;
  archive(id: string): Promise<LessonResponseDto>;
  getStats(id: string): Promise<LessonStatsDto>;
}

export class LessonServiceImpl
  extends BaseService<Aula>
  implements LessonService
{
  constructor(
    private lessonRepository: LessonRepository,
    private courseRepository: CourseRepository
  ) {
    super(lessonRepository, "Aula");
  }

  async createLesson(data: CreateLessonDto): Promise<LessonResponseDto> {
    // Validate input data
    const validatedData = createLessonSchema.parse(data);

    // Check if course exists
    if (validatedData.courseId) {
      const course = await this.courseRepository.findById(
        validatedData.courseId
      );
      if (!course) {
        throw new AppError("Curso não encontrado", 404);
      }

      // Use course instructor if no instructor specified
      if (!validatedData.instructorId) {
        validatedData.instructorId = course.instructorId?.toString();
      }
    }

    // Validate instructor exists if provided
    if (validatedData.instructorId) {
      const instructorExists =
        await this.lessonRepository.prisma.user.findUnique({
          where: { id: validatedData.instructorId },
        });

      if (!instructorExists) {
        throw new AppError("Instrutor não encontrado", 404);
      }
    }

    // Get next order if not provided
    if (!validatedData.ordemAula) {
      validatedData.ordemAula = await this.lessonRepository.getNextOrder(
        validatedData.courseId?.toString() || ""
      );
    } else {
      // Check if order already exists in the course
      const existingLesson = await this.lessonRepository.prisma.aula.findFirst({
        where: {
          courseId: Number(validatedData.courseId),
          ordemAula: validatedData.ordemAula,
        },
      });

      if (existingLesson) {
        throw new AppError("Já existe uma aula com esta ordem no curso", 409);
      }
    }

    // Create lesson data with proper types
    // Note: Remove 'materials' as it's a relation, not a column
    const { materials, ...validatedDataWithoutMaterials } = validatedData;

    const lessonData = {
      ...validatedDataWithoutMaterials,
      courseId: Number(validatedData.courseId),
      duration: validatedData.duration || 0,
      ordemAula: validatedData.ordemAula || 1,
      status: validatedData.status || "DRAFT",
      isPreview: validatedData.isPreview || false,
    };

    // Create lesson
    const lesson = await this.lessonRepository.create(
      lessonData as CreateData<Aula>
    );

    // Emit lesson created event
    try {
      const course = await this.courseRepository.findById(
        validatedData.courseId
      );
      if (course) {
        const instructor = await this.lessonRepository.prisma.user.findUnique({
          where: { id: validatedData.instructorId! },
          select: { name: true },
        });

        const event = AppEventEmitter.createEvent(
          "lesson.created",
          (course as any).tenantId,
          validatedData.instructorId!,
          {
            lessonId: lesson.id,
            courseId: course.id,
            lessonName: lesson.name,
            courseName: course.title,
            instructorId: Number(validatedData.instructorId),
            instructorName: instructor?.name || "Unknown",
          }
        );

        await eventEmitter.emit(event);
      }
    } catch (error) {
      logger.error("Failed to emit lesson created event", {
        lessonId: lesson.id,
        courseId: validatedData.courseId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return this.toResponseDto(lesson);
  }

  async updateLesson(
    id: string,
    data: UpdateLessonDto
  ): Promise<LessonResponseDto> {
    // Validate input data
    const validatedData = updateLessonSchema.parse(data);

    // Check if lesson exists
    const existingLesson = await this.findByIdOrThrow(id);

    // Validate instructor exists if changing instructor
    if (validatedData.instructorId) {
      const instructorExists =
        await this.lessonRepository.prisma.user.findUnique({
          where: { id: validatedData.instructorId },
        });

      if (!instructorExists) {
        throw new AppError("Instrutor não encontrado", 404);
      }
    }

    // Check if order already exists in the course (if changing order)
    if (
      validatedData.ordemAula &&
      validatedData.ordemAula !== existingLesson.ordemAula
    ) {
      const existingLessonWithOrder =
        await this.lessonRepository.prisma.aula.findFirst({
          where: {
            courseId: existingLesson.courseId,
            ordemAula: validatedData.ordemAula,
            id: { not: Number(id) },
          },
        });

      if (existingLessonWithOrder) {
        throw new AppError("Já existe uma aula com esta ordem no curso", 409);
      }
    }

    // Update lesson
    const updatedLesson = await this.lessonRepository.update(
      id,
      validatedData as UpdateData<Aula>
    );

    // Update course total duration if duration changed
    if (validatedData.duration !== undefined) {
      // Note: updateTotalDuration method needs to be implemented in CourseRepository
      // await this.courseRepository.updateTotalDuration(existingLesson.courseId);
    }

    return this.toResponseDto(updatedLesson);
  }

  async findLessonsByCourse(
    courseId: string,
    options?: FindManyOptions<Aula>
  ): Promise<LessonResponseDto[]> {
    // Check if course exists
    const courseExists = await this.courseRepository.exists(Number(courseId));
    if (!courseExists) {
      throw new AppError("Curso não encontrado", 404);
    }

    return this.lessonRepository.findByCourse(courseId, options);
  }

  async findLessonsByInstructor(
    instructorId: string,
    options?: FindManyOptions<Aula>
  ): Promise<LessonResponseDto[]> {
    // Validate instructor exists
    const instructorExists = await this.lessonRepository.prisma.user.findUnique(
      {
        where: { id: instructorId },
      }
    );

    if (!instructorExists) {
      throw new AppError("Instrutor não encontrado", 404);
    }

    return this.lessonRepository.findByInstructor(instructorId, options);
  }

  async findLessonWithProgress(
    lessonId: string,
    userId: string
  ): Promise<LessonWithProgressDto> {
    const lesson = await this.lessonRepository.findWithProgress(
      lessonId,
      userId
    );

    if (!lesson) {
      throw new AppError("Aula não encontrada", 404);
    }

    return lesson;
  }

  async findLessonsWithFilters(
    query: LessonQueryDto
  ): Promise<{ lessons: LessonResponseDto[]; total: number; pages: number }> {
    const { lessons, total } =
      await this.lessonRepository.findManyWithFilters(query);
    const pages = Math.ceil(total / query.limit);

    return {
      lessons,
      total,
      pages,
    };
  }

  async reorderLessons(
    courseId: string,
    data: ReorderLessonsDto
  ): Promise<void> {
    // Validate input data
    const validatedData = reorderLessonsSchema.parse(data);

    // Check if course exists
    const courseExists = await this.courseRepository.exists(Number(courseId));
    if (!courseExists) {
      throw new AppError("Curso não encontrado", 404);
    }

    // Validate all lessons belong to the course
    const lessonIds = validatedData.lessons.map((l) => Number(l.id));
    const existingLessons = await this.lessonRepository.prisma.aula.findMany({
      where: {
        id: { in: lessonIds },
        courseId: Number(courseId),
      },
      select: { id: true },
    });

    if (existingLessons.length !== lessonIds.length) {
      throw new AppError(
        "Uma ou mais aulas não pertencem ao curso especificado",
        400
      );
    }

    // Check for duplicate orders
    const orders = validatedData.lessons.map((l) => l.ordemAula);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      throw new AppError("Ordens duplicadas não são permitidas", 400);
    }

    // Reorder lessons
    await this.lessonRepository.reorderLessons(courseId, validatedData.lessons);
  }

  async publishLesson(id: string): Promise<LessonResponseDto> {
    // Check if lesson exists
    const lesson = await this.findByIdOrThrow(id);

    // Check if course is published
    const course = await this.courseRepository.findById(
      lesson.courseId?.toString() || ""
    );
    if (!course || course.status !== "PUBLISHED") {
      throw new AppError(
        "Não é possível publicar uma aula de um curso não publicado",
        400
      );
    }

    // Update status to published
    const updatedLesson = await this.lessonRepository.update(id, {
      status: "PUBLISHED",
    } as UpdateData<Aula>);

    return this.toResponseDto(updatedLesson);
  }

  async archiveLesson(id: string): Promise<LessonResponseDto> {
    // Check if lesson exists
    await this.findByIdOrThrow(id);

    // Update status to archived
    const updatedLesson = await this.lessonRepository.update(id, {
      status: "ARCHIVED",
    } as UpdateData<Aula>);

    return this.toResponseDto(updatedLesson);
  }

  async markAsWatched(
    lessonId: string,
    userId: string,
    watchTime: number
  ): Promise<void> {
    // Check if lesson exists
    await this.findByIdOrThrow(lessonId);

    // Check if user exists
    const userExists = await this.lessonRepository.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      throw new AppError("Usuário não encontrado", 404);
    }

    await this.lessonRepository.markAsWatched(lessonId, userId, watchTime);
  }

  async markAsCompleted(lessonId: string, userId: string): Promise<void> {
    // Check if lesson exists
    await this.findByIdOrThrow(lessonId);

    // Check if user exists
    const userExists = await this.lessonRepository.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      throw new AppError("Usuário não encontrado", 404);
    }

    await this.lessonRepository.markAsCompleted(lessonId, userId);
  }

  async getLessonStats(): Promise<LessonStatsDto> {
    return this.lessonRepository.getStats();
  }

  async getCourseStats(courseId: string): Promise<CourseLessonsDto> {
    // Check if course exists
    const courseExists = await this.courseRepository.exists(Number(courseId));
    if (!courseExists) {
      throw new AppError("Curso não encontrado", 404);
    }

    return this.lessonRepository.getCourseStats(courseId);
  }

  toResponseDto(
    lesson: Aula & {
      course?: { id: string; title: string; thumbnail?: string | null };
    }
  ): LessonResponseDto {
    const dto: LessonResponseDto = {
      id: lesson.id.toString(),
      name: lesson.name,
      courseId: lesson.courseId?.toString() || "",
      instructorId: lesson.instructorId,
      path: lesson.path,
      duration: lesson.duration,
      ordemAula: lesson.ordemAula,
      materials: [],
      isPreview: lesson.isPreview,
      status: lesson.status,
      totalComments: 0,
      totalLikes: 0,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };

    if (lesson.description) dto.description = lesson.description;
    if (lesson.thumbnail) dto.thumbnail = lesson.thumbnail;
    if (lesson.videoUrl) dto.videoUrl = lesson.videoUrl;

    if (lesson.course) {
      const courseDto: any = {
        id: lesson.course.id.toString(),
        title: lesson.course.title,
      };
      if (lesson.course.thumbnail)
        courseDto.thumbnail = lesson.course.thumbnail;
      dto.course = courseDto;
    }

    return dto;
  }

  protected async validateCreateData(data: CreateLessonDto): Promise<void> {
    // Validate instructor exists
    if (data.instructorId) {
      const instructorExists =
        await this.lessonRepository.prisma.user.findUnique({
          where: { id: data.instructorId },
        });

      if (!instructorExists) {
        throw new AppError("Instrutor não encontrado", 400);
      }
    }

    // Validate course exists
    if (data.courseId) {
      const courseExists = await this.courseRepository.exists(
        Number(data.courseId)
      );
      if (!courseExists) {
        throw new AppError("Curso não encontrado", 400);
      }
    }

    // Check if lesson with same name exists in the course
    const existingLesson = await this.lessonRepository.prisma.aula.findFirst({
      where: {
        name: data.name,
        courseId: Number(data.courseId),
      },
    });

    if (existingLesson) {
      throw new AppError("Já existe uma aula com este nome neste curso", 400);
    }
  }

  protected async validateUpdateData(
    id: string,
    data: UpdateLessonDto
  ): Promise<void> {
    // Validate instructor exists if being updated
    if (data.instructorId) {
      const instructorExists =
        await this.lessonRepository.prisma.user.findUnique({
          where: { id: data.instructorId },
        });

      if (!instructorExists) {
        throw new AppError("Instrutor não encontrado", 400);
      }
    }

    // Check if lesson with same order exists in the course (excluding current lesson)
    if (data.ordemAula) {
      const currentLesson = await this.repository.findById(id);
      if (!currentLesson) {
        throw new AppError("Aula não encontrada", 404);
      }

      const existingLessonWithOrder =
        await this.lessonRepository.prisma.aula.findFirst({
          where: {
            courseId: currentLesson.courseId,
            ordemAula: data.ordemAula,
            id: { not: parseInt(id) },
          },
        });

      if (existingLessonWithOrder) {
        throw new AppError(
          "Já existe uma aula com esta ordem neste curso",
          400
        );
      }
    }
  }

  override async validateDelete(id: string): Promise<void> {
    // Check if lesson has progress records
    const progressCount = await this.lessonRepository.prisma.userProgress.count(
      {
        where: { aulaId: parseInt(id) },
      }
    );

    if (progressCount > 0) {
      throw new AppError(
        "Não é possível excluir uma aula que possui progresso de alunos",
        400
      );
    }
  }

  // Additional methods for compatibility
  async publish(id: string): Promise<LessonResponseDto> {
    return this.publishLesson(id);
  }

  async archive(id: string): Promise<LessonResponseDto> {
    return this.archiveLesson(id);
  }

  async getStats(_id: string): Promise<LessonStatsDto> {
    return this.getLessonStats();
  }
}
