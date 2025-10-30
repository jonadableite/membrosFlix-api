import type { Notification, User } from "@prisma/client";
import { BaseRepository } from "@/core/base/base.repository";
import type {
  Repository,
  FindManyOptions,
} from "@/core/interfaces/base.interface";

// Extend Notification to match BaseEntity
interface NotificationEntity extends Notification {
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationRepository extends Repository<NotificationEntity> {
  getUserNotifications(
    userId: string,
    tenantId: string,
    options?: FindManyOptions<Notification>
  ): Promise<Notification[]>;
  markAllAsRead(userId: string, tenantId: string): Promise<void>;
  getUnreadCount(userId: string, tenantId: string): Promise<number>;
  getEnrolledStudents(courseId: number): Promise<User[]>;
  getTenantStudents(tenantId: string): Promise<User[]>;
  getCourseInstructor(
    courseId: number
  ): Promise<{ instructorId: number } | null>;
}

export class NotificationRepositoryImpl
  extends BaseRepository<NotificationEntity>
  implements NotificationRepository
{
  constructor(prisma: any) {
    super(prisma, "notification");
  }

  async getUserNotifications(
    userId: string,
    _tenantId: string,
    options: FindManyOptions<Notification> = {}
  ): Promise<Notification[]> {
    const { where, orderBy, skip, take } = options;

    return await this.model.findMany({
      where: {
        ...where,
        userId,
      },
      orderBy: orderBy || { criadoEm: "desc" },  // ✅ FIX: usar criadoEm ao invés de createdAt
      skip,
      take,
    });
  }

  async markAllAsRead(userId: string, _tenantId: string): Promise<void> {
    await this.model.updateMany({
      where: {
        userId,
        lida: false,
      },
      data: {
        lida: true,
      },
    });
  }

  async getUnreadCount(userId: string, _tenantId: string): Promise<number> {
    return await this.model.count({
      where: {
        userId,
        lida: false,
      },
    });
  }

  async getEnrolledStudents(courseId: number): Promise<User[]> {
    // Get all students enrolled in the course
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        courseId,
      },
      include: {
        user: true,
      },
    });

    return enrollments.map((enrollment) => enrollment.user);
  }

  async getTenantStudents(_tenantId: string): Promise<User[]> {
    // Get all students in the tenant
    return await this.prisma.user.findMany({
      where: {
        // tenantId, // Will be added when schema is updated
        role: "STUDENT" as any,
      },
    });
  }

  async getCourseInstructor(
    courseId: number
  ): Promise<{ instructorId: number } | null> {
    const course = await this.prisma.curso.findUnique({
      where: {
        id: courseId,
      },
      select: {
        instructorId: true,
      },
    });

    if (!course || !course.instructorId) {
      return null;
    }

    return { instructorId: course.instructorId };
  }
}
