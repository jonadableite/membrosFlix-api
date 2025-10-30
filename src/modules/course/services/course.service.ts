import type { Curso } from "@prisma/client";
import { BaseService } from '../../../core/base/base.service.js';
import { AppError } from '../../../shared/errors/app.error.js';
import type {
  Service,
  FindManyOptions,
  CreateData,
  UpdateData,
} from '../../../core/interfaces/base.interface.js';
import type { CourseRepository } from '../repositories/course.repository.js';
import type {
  CreateCourseDto,
  UpdateCourseDto,
  CourseQueryDto,
  CourseResponseDto,
  CourseWithLessonsDto,
  CourseStatsDto,
} from '../dtos/course.dto.js';
import { createCourseSchema, updateCourseSchema } from '../dtos/course.dto.js';
import { Cache } from '../../../shared/decorators/cache.decorator.js';
import { invalidateEntityCache } from '../../../shared/decorators/cache.decorator.js';

export interface CourseService extends Service<Curso> {
  createCourse(data: CreateCourseDto): Promise<CourseResponseDto>;
  updateCourse(id: number, data: UpdateCourseDto): Promise<CourseResponseDto>;
  findCourseWithLessons(id: number): Promise<CourseWithLessonsDto>;
  findCoursesByInstructor(
    instructorId: number,
    options?: FindManyOptions<Curso>
  ): Promise<CourseResponseDto[]>;
  findCoursesWithFilters(
    query: CourseQueryDto
  ): Promise<{ courses: CourseResponseDto[]; total: number; pages: number }>;
  publishCourse(id: number): Promise<CourseResponseDto>;
  archiveCourse(id: number): Promise<CourseResponseDto>;
  enrollStudent(courseId: number, studentId: string): Promise<void>;
  unenrollStudent(courseId: number, studentId: string): Promise<void>;
  getCourseStats(): Promise<CourseStatsDto>;
  getInstructorStats(instructorId: number): Promise<any>;
  toResponseDto(course: Curso & any): CourseResponseDto;
}

export class CourseServiceImpl
  extends BaseService<Curso>
  implements CourseService
{
  constructor(private courseRepository: CourseRepository) {
    super(courseRepository, "Curso");
  }

  async createCourse(data: CreateCourseDto): Promise<CourseResponseDto> {
    // Validate input data (temporarily remove tenantId validation)
    const { tenantId: inputTenantId, ...dataWithoutTenant } = data;
    const validatedData = createCourseSchema
      .omit({ tenantId: true })
      .parse(dataWithoutTenant);

    // Get tenantId from input or find default tenant
    let tenantId = inputTenantId;

    if (
      !tenantId ||
      !tenantId.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    ) {
      // Not a UUID, try to find tenant by domain
      const whereConditions: any = [{ domain: "localhost" }];

      // Only add DEFAULT_TENANT_ID if it's a valid UUID
      const defaultTenantId = process.env.DEFAULT_TENANT_ID;
      if (
        defaultTenantId &&
        defaultTenantId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
      ) {
        whereConditions.push({ id: defaultTenantId });
      }

      const tenant = await this.repository.prisma.tenant.findFirst({
        where: {
          OR: whereConditions,
        },
      });

      if (!tenant) {
        throw AppError.badRequest("Tenant não encontrado");
      }

      tenantId = tenant.id;
    }

    // Check if course with same title already exists
    const existingCourse = await this.courseRepository.findByTitle(
      validatedData.title
    );
    if (existingCourse) {
      throw AppError.conflict("Já existe um curso com este título");
    }

    // Validate instructor exists if provided
    if (validatedData.instructorId) {
      const instructorExists =
        await this.repository.prisma.instructor.findUnique({
          where: { id: validatedData.instructorId },
        });

      if (!instructorExists) {
        throw AppError.notFound("Instrutor não encontrado");
      }
    }

    // Create course
    const courseData: any = {
      ...validatedData,
      tenantId, // Add resolved tenant ID
      path: validatedData.path || null,
      totalAulas: 0,
      slug: validatedData.title.toLowerCase().replace(/\s+/g, "-"),
    };
    const course = await this.courseRepository.create(courseData);

    // Invalidate cache
    await invalidateEntityCache("course");

    return this.toResponseDto(course);
  }

  async updateCourse(
    id: number,
    data: UpdateCourseDto
  ): Promise<CourseResponseDto> {
    // Remove tenantId from updates (cannot change tenant)
    const { tenantId, ...dataWithoutTenant } = data;

    // Validate input data
    const validatedData = updateCourseSchema
      .omit({ tenantId: true })
      .parse(dataWithoutTenant);

    // Check if course exists
    const existingCourse = await this.findByIdOrThrow(id);

    // Check if title is being changed and if new title already exists
    if (validatedData.title && validatedData.title !== existingCourse.title) {
      const courseWithSameTitle = await this.courseRepository.findByTitle(
        validatedData.title
      );
      if (courseWithSameTitle && courseWithSameTitle.id !== id) {
        throw AppError.conflict("Já existe um curso com este título");
      }
    }

    // Validate instructor exists if being changed
    if (
      validatedData.instructorId &&
      validatedData.instructorId !== existingCourse.instructorId
    ) {
      const instructorExists =
        await this.repository.prisma.instructor.findUnique({
          where: { id: validatedData.instructorId },
        });

      if (!instructorExists) {
        throw AppError.notFound("Instrutor não encontrado");
      }
    }

    // Update course
    const updateData = {
      ...validatedData,
      price: validatedData.price
        ? new (require("decimal.js"))(validatedData.price)
        : undefined,
    };
    const updatedCourse = await this.courseRepository.update(
      id,
      updateData as any
    );

    // Invalidate cache
    await invalidateEntityCache("course", id);

    return this.toResponseDto(updatedCourse);
  }

  @Cache({ ttl: 300, keyPrefix: "course:lessons:" })
  async findCourseWithLessons(id: number): Promise<CourseWithLessonsDto> {
    const course = await this.courseRepository.findWithLessons(id);

    if (!course) {
      throw AppError.notFound("Curso não encontrado");
    }

    return course;
  }

  @Cache({ ttl: 180, keyPrefix: "course:instructor:" })
  async findCoursesByInstructor(
    instructorId: number,
    options?: FindManyOptions<Curso>
  ): Promise<CourseResponseDto[]> {
    const courses = await this.courseRepository.findByInstructor(
      instructorId,
      options
    );
    return courses.map((course) => this.toResponseDto(course));
  }

  @Cache({ ttl: 120, keyPrefix: "course:filters:" })
  async findCoursesWithFilters(
    query: CourseQueryDto
  ): Promise<{ courses: CourseResponseDto[]; total: number; pages: number }> {
    const { courses, total } =
      await this.courseRepository.findManyWithFilters(query);
    const pages = Math.ceil(total / query.limit);

    return {
      courses,
      total,
      pages,
    };
  }

  async publishCourse(id: number): Promise<CourseResponseDto> {
    // Check if course exists
    await this.findById(id);

    // Validate course has at least one lesson
    const courseWithLessons = await this.courseRepository.findWithLessons(id);
    if (!courseWithLessons || courseWithLessons.aulas.length === 0) {
      throw AppError.badRequest("Não é possível publicar um curso sem aulas");
    }

    // Update status to published
    const updatedCourse = await this.courseRepository.updateStatus(
      id,
      "PUBLISHED"
    );

    return this.toResponseDto(updatedCourse);
  }

  async archiveCourse(id: number): Promise<CourseResponseDto> {
    // Check if course exists
    await this.findById(id);

    // Update status to archived
    const updatedCourse = await this.courseRepository.updateStatus(
      id,
      "ARCHIVED"
    );

    return this.toResponseDto(updatedCourse);
  }

  async enrollStudent(courseId: number, studentId: string): Promise<void> {
    // Check if course exists and is published
    const course = await this.findById(courseId);
    if (!course) {
      throw AppError.notFound("Curso não encontrado");
    }
    if (course.status !== "PUBLISHED" && course.status !== "ACTIVE") {
      throw AppError.badRequest(
        "Não é possível se inscrever em um curso não publicado"
      );
    }

    // Check if student exists
    const studentExists = await this.repository.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!studentExists || !studentExists.id) {
      throw AppError.notFound("Estudante não encontrado");
    }

    // NOTE: Enrollment functionality temporarily disabled
    // TODO: Add Enrollment model to Prisma schema
    // For now, we track progress through UserProgress model
  }

  async unenrollStudent(_courseId: number, _studentId: string): Promise<void> {
    // NOTE: Enrollment functionality temporarily disabled
    // TODO: Add Enrollment model to Prisma schema
    throw AppError.notImplemented(
      "Funcionalidade de desinscr ição em desenvolvimento"
    );
  }

  async getCourseStats(): Promise<CourseStatsDto> {
    return this.courseRepository.getStats();
  }

  async getInstructorStats(instructorId: number): Promise<any> {
    const stats = await this.courseRepository.getInstructorStats(instructorId);

    if (!stats) {
      throw AppError.notFound("Instrutor não encontrado");
    }

    return stats;
  }

  toResponseDto(course: Curso & any): CourseResponseDto {
    const dto: CourseResponseDto = {
      id: course.id,
      title: course.title,
      status: course.status,
      totalAulas: course._count?.aulas || 0,
      totalEstudantes: course._count?.enrollments || 0,
      totalComments: course._count?.comments || 0,
      totalLikes: course._count?.likes || 0,
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
        name: course.instructor.user?.name || course.instructor.name,
      };
      if (
        course.instructor.user?.profilePicture ||
        course.instructor.profilePicture
      ) {
        instructorDto.profilePicture =
          course.instructor.user?.profilePicture ||
          course.instructor.profilePicture;
      }
      if (course.instructor.bio) instructorDto.bio = course.instructor.bio;
      dto.instructor = instructorDto;
    }

    return dto;
  }

  protected validateCreateData(data: CreateData<Curso>): void {
    createCourseSchema.parse(data);
  }

  protected validateUpdateData(data: UpdateData<Curso>): void {
    updateCourseSchema.partial().parse(data);
  }

  protected override async validateDelete(id: string): Promise<void> {
    // Check if course has enrolled students
    const enrollmentCount = await this.repository.prisma.enrollment.count({
      where: { courseId: id },
    });

    if (enrollmentCount > 0) {
      throw AppError.badRequest(
        "Não é possível excluir um curso com estudantes inscritos"
      );
    }
  }
}
