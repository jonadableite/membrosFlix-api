import type { Aula, Prisma } from "@prisma/client";
import { BaseRepository } from "../../../core/base/base.repository.js";
import { prisma } from "../../../shared/database/prisma.js";
import type {
  Repository,
  FindManyOptions,
  CreateData,
  UpdateData,
} from "../../../core/interfaces/base.interface.js";
import type {
  LessonQueryDto,
  LessonResponseDto,
  LessonWithProgressDto,
  LessonStatsDto,
  CourseLessonsDto,
  ReorderLessonsDto,
} from "../dtos/lesson.dto";

export interface LessonRepository extends Repository<Aula> {
  findByCourse(
    courseId: string,
    options?: FindManyOptions<Aula>
  ): Promise<LessonResponseDto[]>;
  findByInstructor(
    instructorId: string,
    options?: FindManyOptions<Aula>
  ): Promise<LessonResponseDto[]>;
  findWithProgress(
    lessonId: string,
    userId: string
  ): Promise<LessonWithProgressDto | null>;
  findManyWithFilters(
    query: LessonQueryDto
  ): Promise<{ lessons: LessonResponseDto[]; total: number }>;
  getNextOrder(courseId: string): Promise<number>;
  reorderLessons(
    courseId: string,
    lessons: ReorderLessonsDto["lessons"]
  ): Promise<void>;
  updateDuration(id: string, duration: number): Promise<void>;
  getStats(): Promise<LessonStatsDto>;
  getCourseStats(courseId: string): Promise<CourseLessonsDto>;
  markAsWatched(
    lessonId: string,
    userId: string,
    watchTime: number
  ): Promise<void>;
  markAsCompleted(lessonId: string, userId: string): Promise<void>;
  prisma: typeof prisma;
}

export class LessonRepositoryImpl
  extends BaseRepository<Aula>
  implements LessonRepository
{
  public override prisma = prisma;

  constructor() {
    super(prisma, "aula");
  }

  async findByCourse(
    courseId: string,
    options?: FindManyOptions<Aula>
  ): Promise<LessonResponseDto[]> {
    const { skip, take, orderBy } = options || {};

    const lessons = await this.prisma.aula.findMany({
      where: { courseId: Number(courseId) },
      skip: skip || 0,
      take: take || 10,
      orderBy: orderBy as any,
      include: {
        curso: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return lessons.map((lesson) => this.toResponseDto(lesson));
  }

  async findByInstructor(
    instructorId: string,
    options?: FindManyOptions<Aula>
  ): Promise<LessonResponseDto[]> {
    const { skip, take, orderBy } = options || {};

    const lessons = await this.prisma.aula.findMany({
      where: { instructorId },
      skip: skip || 0,
      take: take || 10,
      orderBy: orderBy as any,
      include: {
        curso: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
        instructor: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return lessons.map((lesson) => this.toResponseDto(lesson));
  }

  async findWithProgress(
    lessonId: string,
    userId: string
  ): Promise<LessonWithProgressDto | null> {
    const lesson = await this.prisma.aula.findUnique({
      where: { id: Number(lessonId) },
      include: {
        curso: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        progress: {
          where: { userId },
          select: {
            id: true,
            userId: true,
            aulaId: true,
            progressoAula: true,
            concluido: true,
            ultimoAcesso: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        comments: {
          where: { userId },
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
        likes: {
          where: { userId },
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    if (!lesson) return null;

    const baseDto = this.toResponseDto(lesson);

    return {
      ...baseDto,
      progress: lesson.progress[0]
        ? {
            id: lesson.progress[0].id.toString(),
            userId: lesson.progress[0].userId,
            completed: lesson.progress[0].concluido || false,
            watchTime: lesson.progress[0].progressoAula || 0,
            ...(lesson.progress[0].ultimoAcesso && {
              completedAt: lesson.progress[0].ultimoAcesso,
            }),
          }
        : undefined,
    } as LessonWithProgressDto;
  }

  async findManyWithFilters(
    query: LessonQueryDto
  ): Promise<{ lessons: LessonResponseDto[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      courseId,
      instructorId,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.AulaWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(courseId && { courseId: Number(courseId) }),
      ...(instructorId && { instructorId }),
      ...(status && { status }),
    };

    const orderBy: Prisma.AulaOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [lessons, total] = await Promise.all([
      this.prisma.aula.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          curso: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              progress: true,
              comments: true,
              likes: true,
            },
          },
        },
      }),
      this.prisma.aula.count({ where }),
    ]);

    return {
      lessons: lessons.map((lesson) => this.toResponseDto(lesson)),
      total,
    };
  }

  async getNextOrder(courseId: string): Promise<number> {
    const lastLesson = await this.prisma.aula.findFirst({
      where: { courseId: Number(courseId) },
      orderBy: { ordemAula: "desc" },
      select: { ordemAula: true },
    });

    return (lastLesson?.ordemAula || 0) + 1;
  }

  async reorderLessons(
    courseId: string,
    lessons: ReorderLessonsDto["lessons"]
  ): Promise<void> {
    const updatePromises = lessons.map(({ id, ordemAula }) =>
      this.prisma.aula.update({
        where: { id: Number(id), courseId: Number(courseId) },
        data: { ordemAula },
      })
    );

    await Promise.all(updatePromises);
  }

  async updateDuration(id: string, duration: number): Promise<void> {
    await this.prisma.aula.update({
      where: { id: Number(id) },
      data: { duration },
    });
  }

  async getStats(): Promise<LessonStatsDto> {
    const [
      totalLessons,
      publishedLessons,
      draftLessons,
      archivedLessons,
      avgDuration,
      totalProgress,
      totalComments,
      totalLikes,
    ] = await Promise.all([
      this.prisma.aula.count(),
      this.prisma.aula.count({ where: { status: "PUBLISHED" } }),
      this.prisma.aula.count({ where: { status: "DRAFT" } }),
      this.prisma.aula.count({ where: { status: "ARCHIVED" } }),
      this.prisma.aula.aggregate({
        _avg: { duration: true },
      }),
      this.prisma.userProgress.count(),
      this.prisma.comment.count(),
      this.prisma.like.count(),
    ]);

    return {
      totalLessons,
      publishedLessons,
      draftLessons,
      archivedLessons,
      totalDuration: 0, // This should be calculated from all lessons
      averageDuration: avgDuration._avg.duration || 0,
      totalViews: totalProgress, // Using progress as views for now
      totalComments,
      totalLikes,
    };
  }

  async getCourseStats(courseId: string): Promise<CourseLessonsDto> {
    const [lessons, totalDuration] = await Promise.all([
      this.prisma.aula.findMany({
        where: { courseId: Number(courseId) },
        select: {
          id: true,
          name: true,
          duration: true,
          ordemAula: true,
          status: true,
        },
        orderBy: { ordemAula: "asc" },
      }),
      this.prisma.aula.aggregate({
        where: { courseId: Number(courseId) },
        _sum: { duration: true },
      }),
    ]);

    return {
      courseId,
      courseTitle: "", // This should be fetched from course
      lessons: lessons.map((lesson) => this.toResponseDto(lesson)),
      totalLessons: lessons.length,
      totalDuration: totalDuration._sum.duration || 0,
    };
  }

  async markAsWatched(
    lessonId: string,
    userId: string,
    watchTime: number
  ): Promise<void> {
    await this.prisma.userProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: 0, // This should be fetched from lesson
        },
      },
      update: {
        progressoAula: watchTime,
        ultimoAcesso: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId,
        courseId: 0, // This should be fetched from lesson
        aulaId: Number(lessonId),
        progressoAula: watchTime,
        concluido: false,
      },
    });
  }

  async markAsCompleted(lessonId: string, userId: string): Promise<void> {
    // First get the lesson to find the courseId
    const lesson = await this.prisma.aula.findUnique({
      where: { id: Number(lessonId) },
      select: { courseId: true },
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    await this.prisma.userProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.courseId || 0,
        },
      },
      update: {
        concluido: true,
        ultimoAcesso: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId,
        courseId: lesson.courseId || 0,
        aulaId: Number(lessonId),
        progressoAula: 0,
        concluido: true,
      },
    });
  }

  public override async create(data: CreateData<Aula>): Promise<Aula> {
    return this.prisma.aula.create({
      data: {
        ...data,
        ordemAula:
          data.ordemAula ||
          (await this.getNextOrder(data.courseId?.toString() || "")),
      },
    });
  }

  public override async update(
    id: string | number,
    data: UpdateData<Aula>
  ): Promise<Aula> {
    return this.prisma.aula.update({
      where: { id: Number(id) },
      data,
    });
  }

  private toResponseDto(lesson: any): LessonResponseDto {
    return {
      id: lesson.id.toString(),
      name: lesson.name,
      description: lesson.description || undefined,
      courseId: lesson.courseId?.toString() || "",
      instructorId: lesson.instructorId || undefined,
      path: lesson.path || undefined,
      duration: lesson.duration || undefined,
      ordemAula: lesson.ordemAula,
      thumbnail: lesson.thumbnail || undefined,
      videoUrl: lesson.videoUrl || undefined,
      materials: [], // Default empty array - needs to be populated from materials relation
      isPreview: lesson.isPreview,
      status: lesson.status,
      totalComments: lesson._count?.comments || 0,
      totalLikes: lesson._count?.likes || 0,
      course: lesson.curso
        ? {
            id: lesson.curso.id.toString(),
            title: lesson.curso.title,
            thumbnail: lesson.curso.thumbnail || undefined,
          }
        : {
            id: "",
            title: "",
            thumbnail: undefined,
          },
      instructor: lesson.instructor
        ? {
            id: lesson.instructor.id,
            name: lesson.instructor.name,
            profilePicture: lesson.instructor.profilePicture || undefined,
          }
        : {
            id: "",
            name: "",
            profilePicture: undefined,
          },
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };
  }
}
