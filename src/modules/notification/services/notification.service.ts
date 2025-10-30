import type { Notification } from "@prisma/client";

// Extend Notification to match BaseEntity
interface NotificationEntity extends Notification {
  createdAt: Date;
  updatedAt: Date;
}
import { BaseService } from "@/core/base/base.service";
import { AppError } from "@/shared/errors/app.error";
import type {
  Service,
  FindManyOptions,
} from "@/core/interfaces/base.interface";
import type { NotificationRepository } from "../repositories/notification.repository";
import type {
  NotificationResponseDto,
  CreateNotificationDto,
  UpdateNotificationDto,
} from "../dtos/notification.dto";
import {
  createNotificationSchema,
  updateNotificationSchema,
} from "../dtos/notification.dto";
import { eventEmitter } from "@/shared/events/event.emitter";
import type {
  LessonCreatedEvent,
  CoursePublishedEvent,
  UserEnrolledEvent,
} from "@/shared/events/event.types";
import logger from "@/shared/logger/logger";

export interface NotificationService extends Service<NotificationEntity> {
  createNotification(
    data: CreateNotificationDto
  ): Promise<NotificationResponseDto>;
  updateNotification(
    id: string,
    data: UpdateNotificationDto
  ): Promise<NotificationResponseDto>;
  getUserNotifications(
    userId: string,
    tenantId: string,
    options?: FindManyOptions<Notification>
  ): Promise<NotificationResponseDto[]>;
  markAsRead(id: string, userId: string, _tenantId: string): Promise<void>;
  markAllAsRead(userId: string, tenantId: string): Promise<void>;
  getUnreadCount(userId: string, tenantId: string): Promise<number>;
  toResponseDto(notification: Notification & any): NotificationResponseDto;
}

export class NotificationServiceImpl
  extends BaseService<NotificationEntity>
  implements NotificationService
{
  constructor(private notificationRepository: NotificationRepository) {
    super(notificationRepository, "Notification");
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle lesson created events
    eventEmitter.subscribe("lesson.created", {
      handle: async (event: LessonCreatedEvent) => {
        await this.handleLessonCreated(event);
      },
    });

    // Handle course published events
    eventEmitter.subscribe("course.published", {
      handle: async (event: CoursePublishedEvent) => {
        await this.handleCoursePublished(event);
      },
    });

    // Handle user enrolled events
    eventEmitter.subscribe("user.enrolled", {
      handle: async (event: UserEnrolledEvent) => {
        await this.handleUserEnrolled(event);
      },
    });

    // Handle user registered events
    eventEmitter.subscribe("user.registered", {
      handle: async (event: any) => {
        await this.handleUserRegistered(event);
      },
    });
  }

  async createNotification(
    data: CreateNotificationDto
  ): Promise<NotificationResponseDto> {
    const validatedData = createNotificationSchema.parse(data);

    const notification = await this.notificationRepository.create(
      validatedData as any
    );

    logger.info("Notification created", {
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.tipo,
    });

    return this.toResponseDto(notification);
  }

  async updateNotification(
    id: string,
    data: UpdateNotificationDto
  ): Promise<NotificationResponseDto> {
    const validatedData = updateNotificationSchema.parse(data);

    await this.findByIdOrThrow(id);

    const updatedNotification = await this.notificationRepository.update(
      id,
      validatedData as any
    );

    return this.toResponseDto(updatedNotification);
  }

  async getUserNotifications(
    userId: string,
    _tenantId: string,
    options: FindManyOptions<Notification> = {}
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.findMany({
      ...options,
      where: {
        ...options.where,
        userId,
      },
      orderBy: { criadoEm: "desc" } as any,  // ✅ FIX: usar criadoEm ao invés de createdAt
    });

    return notifications.map((notification) =>
      this.toResponseDto(notification)
    );
  }

  async markAsRead(
    id: string,
    userId: string,
    _tenantId: string
  ): Promise<void> {
    const notification = await this.findByIdOrThrow(id);

    // Verify ownership
    if (notification.userId !== userId) {
      throw AppError.forbidden("Cannot access this notification");
    }

    await this.notificationRepository.update(id, { lida: true });

    logger.info("Notification marked as read", {
      notificationId: id,
      userId,
    });
  }

  async markAllAsRead(userId: string, tenantId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId, tenantId);

    logger.info("All notifications marked as read", { userId });
  }

  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    return await this.notificationRepository.getUnreadCount(userId, tenantId);
  }

  // Notification helpers for comment interactions
  async notifyCommentLiked(params: {
    commentId: string;
    commentAuthorId: string;
    commentText: string;
    likedByUserId: string;
    likedByUserName: string;
    tenantId: string;
    lessonId: number;
    courseId: number;
  }): Promise<void> {
    // Don't notify if user liked their own comment
    if (params.commentAuthorId === params.likedByUserId) {
      return;
    }

    const timestamp = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    await this.createNotification({
      userId: params.commentAuthorId,
      tenantId: params.tenantId,
      tipo: "NOVO_COMENTARIO",
      mensagem: `❤️ ${params.likedByUserName} curtiu seu comentário: "${params.commentText.substring(0, 50)}${params.commentText.length > 50 ? "..." : ""}"`,
      dados: {
        type: "comment_liked",
        commentId: params.commentId,
        commentText: params.commentText,
        likedByUserId: params.likedByUserId,
        likedByUserName: params.likedByUserName,
        lessonId: params.lessonId,
        courseId: params.courseId,
        timestamp: new Date().toISOString(),
        likedAt: timestamp,
        actionUrl: `/cursos/${params.courseId}/aulas/${params.lessonId}`,
      },
    });
  }

  async notifyCommentReplied(params: {
    originalCommentId: string;
    originalCommentAuthorId: string;
    originalCommentText: string;
    replyId: string;
    replyText: string;
    replyAuthorId: string;
    replyAuthorName: string;
    tenantId: string;
    lessonId: number;
    courseId: number;
  }): Promise<void> {
    // Don't notify if user replied to their own comment
    if (params.originalCommentAuthorId === params.replyAuthorId) {
      return;
    }

    const timestamp = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    await this.createNotification({
      userId: params.originalCommentAuthorId,
      tenantId: params.tenantId,
      tipo: "NOVO_COMENTARIO",
      mensagem: `💬 ${params.replyAuthorName} respondeu seu comentário: "${params.replyText.substring(0, 50)}${params.replyText.length > 50 ? "..." : ""}"`,
      dados: {
        type: "comment_replied",
        originalCommentId: params.originalCommentId,
        originalCommentText: params.originalCommentText,
        replyId: params.replyId,
        replyText: params.replyText,
        replyAuthorId: params.replyAuthorId,
        replyAuthorName: params.replyAuthorName,
        lessonId: params.lessonId,
        courseId: params.courseId,
        timestamp: new Date().toISOString(),
        repliedAt: timestamp,
        actionUrl: `/cursos/${params.courseId}/aulas/${params.lessonId}#comment-${params.originalCommentId}`,
      },
    });
  }

  // Event Handlers
  private async handleLessonCreated(event: LessonCreatedEvent): Promise<void> {
    try {
      // Get all enrolled students for this course
      const enrolledStudents =
        await this.notificationRepository.getEnrolledStudents(
          event.data.courseId
        );

      // Format timestamp
      const postedAt = new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Create rich notifications for each student
      const notificationPromises = enrolledStudents.map((student) =>
        this.createNotification({
          userId: student.id,
          tenantId: event.tenantId,
          tipo: "NOVA_AULA",
          mensagem: `Nova aula: "${event.data.lessonName}" | Curso: ${event.data.courseName || "Curso"} | Postada em ${postedAt}`,
          dados: {
            type: "lesson_created",
            lessonId: event.data.lessonId,
            lessonName: event.data.lessonName,
            courseId: event.data.courseId,
            courseName: event.data.courseName,
            instructorName: event.data.instructorName,
            postedAt,
            timestamp: new Date().toISOString(),
            actionUrl: `/cursos/${event.data.courseId}/aulas/${event.data.lessonId}`,
          },
        })
      );

      await Promise.all(notificationPromises);

      logger.info("Lesson created notifications sent", {
        lessonId: event.data.lessonId,
        courseId: event.data.courseId,
        studentCount: enrolledStudents.length,
      });
    } catch (error) {
      logger.error("Failed to handle lesson created event", {
        eventId: event.id,
        lessonId: event.data.lessonId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async handleCoursePublished(
    event: CoursePublishedEvent
  ): Promise<void> {
    try {
      // Get all students in the tenant
      const students = await this.notificationRepository.getTenantStudents(
        event.tenantId
      );

      // Format timestamp
      const publishedAt = new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Create rich notifications for each student
      const notificationPromises = students.map((student) =>
        this.createNotification({
          userId: student.id,
          tenantId: event.tenantId,
          tipo: "CURSO_NOVO",
          mensagem: `🎉 Novo Curso: "${event.data.courseTitle}" | ${event.data.category || "Categoria não definida"} | Publicado em ${publishedAt}`,
          dados: {
            type: "course_published",
            courseId: event.data.courseId,
            courseTitle: event.data.courseTitle,
            courseDescription: event.data.courseDescription,
            category: event.data.category,
            instructorName: event.data.instructorName,
            publishedAt,
            timestamp: new Date().toISOString(),
            actionUrl: `/cursos/${event.data.courseId}`,
            thumbnail: event.data.thumbnail,
          },
        })
      );

      await Promise.all(notificationPromises);

      logger.info("Course published notifications sent", {
        courseId: event.data.courseId,
        studentCount: students.length,
      });
    } catch (error) {
      logger.error("Failed to handle course published event", {
        eventId: event.id,
        courseId: event.data.courseId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async handleUserEnrolled(event: UserEnrolledEvent): Promise<void> {
    try {
      // Notify the instructor about new enrollment
      const course = await this.notificationRepository.getCourseInstructor(
        event.data.courseId
      );

      if (course?.instructorId) {
        await this.createNotification({
          userId: course.instructorId.toString(),
          tenantId: event.tenantId,
          tipo: "PROGRESSO",
          mensagem: `Novo estudante inscrito no curso: ${event.data.courseTitle}`,
          dados: {
            courseId: event.data.courseId,
            courseTitle: event.data.courseTitle,
            studentId: event.data.userId,
            enrollmentDate: event.data.enrollmentDate,
          },
        });
      }

      logger.info("User enrolled notification sent", {
        courseId: event.data.courseId,
        studentId: event.data.userId,
      });
    } catch (error) {
      logger.error("Failed to handle user enrolled event", {
        eventId: event.id,
        courseId: event.data.courseId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async handleUserRegistered(event: any): Promise<void> {
    try {
      const registeredAt = new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Create welcome notification
      await this.createNotification({
        userId: event.data.userId,
        tenantId: event.tenantId,
        tipo: "BOAS_VINDAS",
        mensagem: `👋 Bem-vindo(a) ${event.data.userName}! Sua conta foi criada com sucesso em ${registeredAt}. Comece sua jornada de aprendizado agora!`,
        dados: {
          type: "user_registered",
          userId: event.data.userId,
          userName: event.data.userName,
          userEmail: event.data.userEmail,
          registeredAt,
          timestamp: new Date().toISOString(),
          actionUrl: "/home",
        },
      });

      logger.info("Welcome notification sent", {
        userId: event.data.userId,
        userName: event.data.userName,
      });
    } catch (error) {
      logger.error("Failed to handle user registered event", {
        eventId: event.id,
        userId: event.data.userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  toResponseDto(notification: Notification & any): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      tipo: notification.tipo,
      mensagem: notification.mensagem,
      dados: notification.dados,
      lida: notification.lida,
      criadoEm: notification.criadoEm,
      atualizadoEm: notification.atualizadoEm,
    };
  }
}
