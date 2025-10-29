import { NotificationServiceImpl } from "../../src/modules/notification/services/notification.service";
// import { eventEmitter } from "../../src/shared/events/event.emitter";
import type { NotificationRepository } from "../../src/modules/notification/repositories/notification.repository";
import type { LessonCreatedEvent } from "../../src/shared/events/event.types";

// Mock the notification repository
const mockNotificationRepository: jest.Mocked<NotificationRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  exists: jest.fn(),
  getUserNotifications: jest.fn(),
  markAllAsRead: jest.fn(),
  getUnreadCount: jest.fn(),
  getEnrolledStudents: jest.fn(),
  getTenantStudents: jest.fn(),
  getCourseInstructor: jest.fn(),
} as any;

// Mock the event emitter
jest.mock("../../src/shared/events/event.emitter", () => ({
  eventEmitter: {
    subscribe: jest.fn(),
    emit: jest.fn(),
  },
}));

describe("NotificationService", () => {
  let notificationService: NotificationServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationServiceImpl(
      mockNotificationRepository
    );
  });

  describe("Event Handling", () => {
    it("should handle lesson created events", async () => {
      const mockEvent: LessonCreatedEvent = {
        id: "event-123",
        type: "lesson.created",
        timestamp: new Date(),
        tenantId: "tenant-123",
        userId: "instructor-1",
        data: {
          lessonId: 1,
          courseId: 1,
          lessonName: "Test Lesson",
          instructorId: 1,
          instructorName: "Test Instructor",
        },
      };

      const mockEnrolledStudents = [
        { id: "student-1", name: "Student 1" },
        { id: "student-2", name: "Student 2" },
      ];

      mockNotificationRepository.getEnrolledStudents.mockResolvedValue(
        mockEnrolledStudents as any
      );
      mockNotificationRepository.create.mockResolvedValue({
        id: "notification-1",
        userId: "student-1",
        tenantId: "tenant-123",
        tipo: "NOVA_AULA",
        mensagem: "Nova aula disponível: Test Lesson",
        dados: {},
        lida: false,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      } as any);

      // Simulate event emission
      await notificationService["handleLessonCreated"](mockEvent);

      expect(
        mockNotificationRepository.getEnrolledStudents
      ).toHaveBeenCalledWith(1);
      expect(mockNotificationRepository.create).toHaveBeenCalledTimes(2);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        userId: "student-1",
        tenantId: "tenant-123",
        tipo: "NOVA_AULA",
        mensagem: "Nova aula disponível: Test Lesson",
        dados: {
          lessonId: 1,
          courseId: 1,
          lessonName: "Test Lesson",
          instructorName: "Test Instructor",
        },
      });
    });

    it("should handle course published events", async () => {
      const mockEvent = {
        id: "event-123",
        type: "course.published" as const,
        timestamp: new Date(),
        tenantId: "tenant-123",
        userId: "instructor-1",
        data: {
          courseId: 1,
          courseTitle: "Test Course",
          instructorId: 1,
          instructorName: "Test Instructor",
        },
      };

      const mockStudents = [
        { id: "student-1", name: "Student 1" },
        { id: "student-2", name: "Student 2" },
      ];

      mockNotificationRepository.getTenantStudents.mockResolvedValue(
        mockStudents as any
      );
      mockNotificationRepository.create.mockResolvedValue({
        id: "notification-1",
        userId: "student-1",
        tenantId: "tenant-123",
        tipo: "CURSO_NOVO",
        mensagem: "Novo curso disponível: Test Course",
        dados: {},
        lida: false,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      } as any);

      await notificationService["handleCoursePublished"](mockEvent);

      expect(mockNotificationRepository.getTenantStudents).toHaveBeenCalledWith(
        "tenant-123"
      );
      expect(mockNotificationRepository.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("Notification Management", () => {
    it("should create notification successfully", async () => {
      const createData = {
        userId: "user-1",
        tenantId: "tenant-123",
        tipo: "NOVA_AULA" as const,
        mensagem: "Test notification",
        dados: { test: "data" },
      };

      const mockNotification = {
        id: "notification-1",
        ...createData,
        lida: false,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      mockNotificationRepository.create.mockResolvedValue(
        mockNotification as any
      );

      const result = await notificationService.createNotification(createData);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        createData
      );
      expect(result).toEqual({
        id: "notification-1",
        userId: "user-1",
        tenantId: "tenant-123",
        tipo: "NOVA_AULA",
        mensagem: "Test notification",
        dados: { test: "data" },
        lida: false,
        criadoEm: mockNotification.criadoEm,
        atualizadoEm: mockNotification.atualizadoEm,
      });
    });

    it("should get user notifications with tenant isolation", async () => {
      const mockNotifications = [
        {
          id: "notification-1",
          userId: "user-1",
          tenantId: "tenant-123",
          tipo: "NOVA_AULA",
          mensagem: "Test notification 1",
          lida: false,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        },
        {
          id: "notification-2",
          userId: "user-1",
          tenantId: "tenant-123",
          tipo: "CURSO_NOVO",
          mensagem: "Test notification 2",
          lida: true,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        },
      ];

      mockNotificationRepository.getUserNotifications.mockResolvedValue(
        mockNotifications as any
      );

      const result = await notificationService.getUserNotifications(
        "user-1",
        "tenant-123"
      );

      expect(
        mockNotificationRepository.getUserNotifications
      ).toHaveBeenCalledWith("user-1", "tenant-123", {});
      expect(result).toHaveLength(2);
    });

    it("should mark notification as read with ownership validation", async () => {
      const mockNotification = {
        id: "notification-1",
        userId: "user-1",
        tenantId: "tenant-123",
        tipo: "NOVA_AULA",
        mensagem: "Test notification",
        lida: false,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      mockNotificationRepository.findById.mockResolvedValue(
        mockNotification as any
      );
      mockNotificationRepository.update.mockResolvedValue({
        ...mockNotification,
        lida: true,
      } as any);

      await notificationService.markAsRead(
        "notification-1",
        "user-1",
        "tenant-123"
      );

      expect(mockNotificationRepository.findById).toHaveBeenCalledWith(
        "notification-1"
      );
      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        "notification-1",
        { lida: true }
      );
    });

    it("should throw error when trying to mark notification as read for different user", async () => {
      const mockNotification = {
        id: "notification-1",
        userId: "user-2", // Different user
        tenantId: "tenant-123",
        tipo: "NOVA_AULA",
        mensagem: "Test notification",
        lida: false,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      mockNotificationRepository.findById.mockResolvedValue(
        mockNotification as any
      );

      await expect(
        notificationService.markAsRead("notification-1", "user-1", "tenant-123")
      ).rejects.toThrow("Cannot access this notification");
    });
  });
});
