import { Router } from "express";
import { authRoutes } from "../modules/auth/routes/auth.routes.js";
import { userRoutes } from "../modules/user/routes/user.routes.js";
import { courseRoutes } from "../modules/course/routes/course.routes.js";
import {
  lessonRoutes,
  courseLessonRoutes,
  instructorLessonRoutes,
} from "../modules/lesson/routes/lesson.routes.js";
import { notificationRoutes } from "../modules/notification/routes/notification.routes.js";
import { instructorRoutes } from "../modules/instructor/routes/instructor.routes.js";
import { commentRoutes } from "../modules/comment/routes/comment.routes.js";
import { uploadRoutes } from "../modules/uploads/routes/upload.routes.js";

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

// Upload routes (presigned URLs for MinIO)
routes.use(`${API_VERSION}/uploads`, uploadRoutes);

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
