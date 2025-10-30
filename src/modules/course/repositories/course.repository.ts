import type { Curso, CourseStatus, Prisma } from "@prisma/client";
import { BaseRepository } from "../../../core/base/base.repository";
import { prisma } from "../../../shared/database/prisma";
import type {
  Repository,
  FindManyOptions,
} from "../../../core/interfaces/base.interface";
import type {
  CourseQueryDto,
  CourseResponseDto,
  CourseWithLessonsDto,
  CourseStatsDto,
} from "../dtos/course.dto";

export interface CourseRepository extends Repository<Curso> {
  findByTitle(title: string): Promise<Curso | null>;
  findByInstructor(
    instructorId: number,
    options?: FindManyOptions<Curso>
  ): Promise<Curso[]>;
  findWithLessons(id: number): Promise<CourseWithLessonsDto | null>;
  findManyWithFilters(
    query: CourseQueryDto
  ): Promise<{ courses: CourseResponseDto[]; total: number }>;
  updateStatus(id: number, status: CourseStatus): Promise<Curso>;
  getStats(): Promise<CourseStatsDto>;
  getInstructorStats(instructorId: number): Promise<any>;
  exists(id: number): Promise<boolean>;
}

export class CourseRepositoryImpl
  extends BaseRepository<Curso>
  implements CourseRepository
{
  constructor() {
    super(prisma, "curso");
  }

  async findByTitle(title: string): Promise<Curso | null> {
    return this.prisma.curso.findFirst({
      where: {
        title: {
          equals: title,
          mode: "insensitive",
        },
      },
    });
  }

  async findByInstructor(
    instructorId: number,
    options?: FindManyOptions<Curso>
  ): Promise<Curso[]> {
    return this.prisma.curso.findMany({
      where: { instructorId },
      ...(options?.skip !== undefined && { skip: options.skip }),
      ...(options?.take !== undefined && { take: options.take }),
      ...(options?.orderBy && { orderBy: options.orderBy as any }),
      include: {
        instructor: {
          select: {
            id: true,
            bio: true,
            expertise: true,
            user: {
              select: {
                name: true,
                email: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });
  }

  async findWithLessons(id: number): Promise<CourseWithLessonsDto | null> {
    const course = await this.prisma.curso.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            bio: true,
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
        aulas: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            ordemAula: true,
            status: true,
            isPreview: true,
            thumbnail: true,
          },
          orderBy: { ordemAula: "asc" },
        },
        _count: {
          select: {
            aulas: true,
            enrollments: true,
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!course) return null;

    const dto: CourseWithLessonsDto = {
      id: course.id,
      title: course.title,
      status: course.status,
      totalAulas: course._count.aulas,
      totalEstudantes: course._count.enrollments,
      totalComments: course._count.comments,
      totalLikes: course._count.likes,
      aulas: course.aulas.map((aula) => {
        const aulaDto: any = {
          id: aula.id,
          name: aula.name,
          ordemAula: aula.ordemAula,
        };
        if (aula.description) aulaDto.description = aula.description;
        if (aula.duration) aulaDto.duration = aula.duration;
        if (aula.thumbnail) aulaDto.thumbnail = aula.thumbnail;
        return aulaDto;
      }),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };

    if (course.description) dto.description = course.description;
    if (course.thumbnail) dto.thumbnail = course.thumbnail;
    if (course.duracaoTotal) dto.duracaoTotal = course.duracaoTotal;
    if (course.price) dto.price = Number(course.price);
    if (course.category) dto.category = course.category;
    if (course.level) dto.level = course.level;
    if (course.tags) dto.tags = course.tags;

    if (course.instructor) {
      const instructorDto: any = {
        id: course.instructor.id,
        name: course.instructor.user.name,
      };
      if (course.instructor.user.profilePicture)
        instructorDto.profilePicture = course.instructor.user.profilePicture;
      if (course.instructor.bio) instructorDto.bio = course.instructor.bio;
      dto.instructor = instructorDto;
    }

    return dto;
  }

  async findManyWithFilters(
    query: CourseQueryDto
  ): Promise<{ courses: CourseResponseDto[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      instructorId,
      status,
      category,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.CursoWhereInput = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(instructorId && { instructorId }),
      ...(status && { status }),
      ...(category && { category }),
    };

    const orderBy: Prisma.CursoOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [courses, total] = await Promise.all([
      this.prisma.curso.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          instructor: {
            select: {
              id: true,
              bio: true,
              user: {
                select: {
                  name: true,
                  profilePicture: true,
                },
              },
            },
          },
          _count: {
            select: {
              aulas: true,
              enrollments: true,
              comments: true,
              likes: true,
            },
          },
        },
      }),
      this.prisma.curso.count({ where }),
    ]);

    return {
      courses: courses.map((course) => {
        const dto: CourseResponseDto = {
          id: course.id,
          title: course.title,
          status: course.status,
          totalAulas: course._count.aulas,
          totalEstudantes: course._count.enrollments,
          totalComments: course._count.comments,
          totalLikes: course._count.likes,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        };

        if (course.description) dto.description = course.description;
        if (course.thumbnail) dto.thumbnail = course.thumbnail;
        if (course.duracaoTotal) dto.duracaoTotal = course.duracaoTotal;
        if (course.price) dto.price = Number(course.price);
        if (course.category) dto.category = course.category;
        if (course.level) dto.level = course.level;
        if (course.tags) dto.tags = course.tags;

        if (course.instructor) {
          const instructorDto: any = {
            id: course.instructor.id,
            name: course.instructor.user.name,
          };
          if (course.instructor.user.profilePicture)
            instructorDto.profilePicture =
              course.instructor.user.profilePicture;
          if (course.instructor.bio) instructorDto.bio = course.instructor.bio;
          dto.instructor = instructorDto;
        }

        return dto;
      }),
      total,
    };
  }

  async updateStatus(id: number, status: CourseStatus): Promise<Curso> {
    return this.prisma.curso.update({
      where: { id },
      data: { status },
    });
  }

  async getStats(): Promise<CourseStatsDto> {
    const [
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      totalStudents,
      totalLessons,
      totalDuration,
    ] = await Promise.all([
      this.prisma.curso.count(),
      this.prisma.curso.count({ where: { status: "PUBLISHED" } }),
      this.prisma.curso.count({ where: { status: "DRAFT" } }),
      this.prisma.curso.count({ where: { status: "ARCHIVED" } }),
      this.prisma.enrollment.count(),
      this.prisma.aula.count(),
      this.prisma.aula.aggregate({
        _sum: { duration: true },
      }),
    ]);

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      totalStudents,
      totalLessons,
      totalDuration: totalDuration._sum.duration || 0,
    };
  }

  async getInstructorStats(instructorId: number): Promise<any> {
    const [totalCourses, publishedCourses, totalStudents] = await Promise.all([
      this.prisma.curso.count({ where: { instructorId } }),
      this.prisma.curso.count({
        where: {
          instructorId,
          status: "PUBLISHED",
        },
      }),
      this.prisma.enrollment.count({
        where: {
          course: {
            instructorId,
          },
        },
      }),
    ]);

    return {
      totalCourses,
      publishedCourses,
      totalStudents,
    };
  }

  override async exists(id: number): Promise<boolean> {
    const course = await this.prisma.curso.findUnique({
      where: { id },
      select: { id: true },
    });
    return course !== null;
  }
}
