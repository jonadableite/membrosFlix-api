export interface BaseEvent {
  id: string;
  type: string;
  timestamp: Date;
  tenantId: string;
  userId?: string;
  data: Record<string, any>;
}

export interface LessonCreatedEvent extends BaseEvent {
  type: "lesson.created";
  data: {
    lessonId: number;
    courseId: number;
    lessonName: string;
    courseName: string;
    instructorId: number;
    instructorName: string;
  };
}

export interface CoursePublishedEvent extends BaseEvent {
  type: "course.published";
  data: {
    courseId: number;
    courseTitle: string;
    courseDescription?: string;
    category?: string;
    thumbnail?: string;
    instructorId: number;
    instructorName: string;
  };
}

export interface UserEnrolledEvent extends BaseEvent {
  type: "user.enrolled";
  data: {
    userId: string;
    courseId: number;
    courseTitle: string;
    enrollmentDate: Date;
  };
}

export interface UserRegisteredEvent extends BaseEvent {
  type: "user.registered";
  data: {
    userId: string;
    userName: string;
    userEmail: string;
  };
}

export type AppEvent =
  | LessonCreatedEvent
  | CoursePublishedEvent
  | UserEnrolledEvent
  | UserRegisteredEvent;

export interface EventHandler<T extends BaseEvent = BaseEvent> {
  handle(event: T): Promise<void>;
}

export interface EventEmitter {
  emit<T extends BaseEvent>(event: T): Promise<void>;
  subscribe<T extends BaseEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
}
