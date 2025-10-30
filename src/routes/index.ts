import { Router } from "express";
import { authRoutes } from "@/modules/auth/routes/auth.routes";
import { userRoutes } from "@/modules/user/routes/user.routes";
import { courseRoutes } from "@/modules/course/routes/course.routes";
import {
  lessonRoutes,
  courseLessonRoutes,
  instructorLessonRoutes,
} from "@/modules/lesson/routes/lesson.routes";
import { notificationRoutes } from "@/modules/notification/routes/notification.routes";
import { instructorRoutes } from "@/modules/instructor/routes/instructor.routes";
import { commentRoutes } from "@/modules/comment/routes/comment.routes";

const routes = Router();

// API version prefix
const API_VERSION = "/v1";

// Authentication routes
routes.use(`${API_VERSION}/auth`, authRoutes);

// User routes
routes.use(`${API_VERSION}/users`, userRoutes);

// Course routes
routes.use(`${API_VERSION}/courses`, courseRoutes);

// Instructor routes
routes.use(`${API_VERSION}/instructors`, instructorRoutes);

// Lesson routes
routes.use(`${API_VERSION}/lessons`, lessonRoutes);

// Notification routes
routes.use(`${API_VERSION}/notifications`, notificationRoutes);

// Comment routes (standalone)
routes.use(`${API_VERSION}/comments`, commentRoutes);

// Nested routes for course lessons
routes.use(`${API_VERSION}/courses/:courseId/lessons`, courseLessonRoutes);

// Nested routes for instructor lessons
routes.use(
  `${API_VERSION}/instructors/:instructorId/lessons`,
  instructorLessonRoutes
);

// Health check route
routes.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API documentation route
routes.get(`${API_VERSION}`, (_req, res) => {
  res.json({
    message: "MembrosFlix API",
    version: "1.0.0",
    documentation: "/api-docs",
    endpoints: {
      auth: `${API_VERSION}/auth`,
      users: `${API_VERSION}/users`,
      courses: `${API_VERSION}/courses`,
      instructors: `${API_VERSION}/instructors`,
      lessons: `${API_VERSION}/lessons`,
      notifications: `${API_VERSION}/notifications`,
    },
  });
});

export default routes;
