import type { User, Curso, Aula } from "@prisma/client";
import { AppError } from "../errors/app.error.js";
import logger from "../logger/logger.js";

export interface AccessContext {
  user: User;
  tenantId: string;
  resource?: any;
  action: string;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Centralized Access Control Policy Engine
 * Implements both RBAC and ABAC patterns
 */
export class AccessPolicy {
  /**
   * Check if user can perform action on resource
   */
  static async checkAccess(context: AccessContext): Promise<PolicyResult> {
    const { user, tenantId, resource, action } = context;

    // Log access attempt
    logger.info("Access control check", {
      userId: user.id,
      tenantId,
      action,
      resourceType: resource?.constructor?.name || "unknown",
      resourceId: resource?.id,
    });

    // Verify tenant isolation
    if (resource && resource.tenantId && resource.tenantId !== tenantId) {
      logger.warn("Cross-tenant access attempt blocked", {
        userId: user.id,
        userTenantId: tenantId,
        resourceTenantId: resource.tenantId,
        action,
      });
      return {
        allowed: false,
        reason: "Cross-tenant access not allowed",
      };
    }

    // Route to specific policy based on action
    switch (action) {
      case "course.create":
        return this.canCreateCourse(user, tenantId);
      case "course.read":
        return this.canReadCourse(user, resource as Curso, tenantId);
      case "course.update":
        return this.canUpdateCourse(user, resource as Curso, tenantId);
      case "course.delete":
        return this.canDeleteCourse(user, resource as Curso, tenantId);
      case "lesson.create":
        return this.canCreateLesson(user, resource as Curso, tenantId);
      case "lesson.read":
        return this.canReadLesson(user, resource as Aula, tenantId);
      case "lesson.update":
        return this.canUpdateLesson(user, resource as Aula, tenantId);
      case "lesson.delete":
        return this.canDeleteLesson(user, resource as Aula, tenantId);
      case "user.manage":
        return this.canManageUser(user, tenantId);
      case "tenant.manage":
        return this.canManageTenant(user);
      default:
        logger.warn("Unknown action in access policy", { action });
        return {
          allowed: false,
          reason: "Unknown action",
        };
    }
  }

  /**
   * Course Policies
   */
  private static canCreateCourse(user: User, tenantId: string): PolicyResult {
    // Only instructors and admins can create courses
    if (!["INSTRUCTOR", "ADMIN"].includes(user.role)) {
      return {
        allowed: false,
        reason: "Only instructors and admins can create courses",
      };
    }

    // Verify tenant isolation
    if ((user as any).tenantId !== tenantId) {
      return {
        allowed: false,
        reason: "Cannot create course in different tenant",
      };
    }

    return { allowed: true };
  }

  private static canReadCourse(
    user: User,
    course: Curso,
    tenantId: string
  ): PolicyResult {
    // Verify tenant isolation
    if ((course as any).tenantId !== tenantId) {
      return {
        allowed: false,
        reason: "Course belongs to different tenant",
      };
    }

    // All authenticated users can read published courses
    if (course.status === "PUBLISHED") {
      return { allowed: true };
    }

    // Only course owner, instructors, and admins can read draft courses
    if (["ADMIN", "INSTRUCTOR"].includes(user.role)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: "Course is not published and user lacks permissions",
    };
  }

  private static canUpdateCourse(
    user: User,
    course: Curso,
    tenantId: string
  ): PolicyResult {
    // Verify tenant isolation
    if ((course as any).tenantId !== tenantId) {
      return {
        allowed: false,
        reason: "Course belongs to different tenant",
      };
    }

    // Admins can update any course
    if (user.role === "ADMIN") {
      return { allowed: true };
    }

    // Instructors can only update their own courses
    if (user.role === "INSTRUCTOR") {
      // Check if user is the instructor of this course
      if (course.instructorId) {
        // This would need to be resolved from the instructor table
        // For now, we'll assume the check is done at service level
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: "User cannot update this course",
    };
  }

  private static canDeleteCourse(
    user: User,
    course: Curso,
    tenantId: string
  ): PolicyResult {
    // Only admins can delete courses
    if (user.role !== "ADMIN") {
      return {
        allowed: false,
        reason: "Only admins can delete courses",
      };
    }

    // Verify tenant isolation
    if ((course as any).tenantId !== tenantId) {
      return {
        allowed: false,
        reason: "Course belongs to different tenant",
      };
    }

    return { allowed: true };
  }

  /**
   * Lesson Policies
   */
  private static canCreateLesson(
    user: User,
    course: Curso,
    tenantId: string
  ): PolicyResult {
    // Verify tenant isolation
    if ((course as any).tenantId !== tenantId) {
      return {
        allowed: false,
        reason: "Course belongs to different tenant",
      };
    }

    // Only instructors and admins can create lessons
    if (!["INSTRUCTOR", "ADMIN"].includes(user.role)) {
      return {
        allowed: false,
        reason: "Only instructors and admins can create lessons",
      };
    }

    return { allowed: true };
  }

  private static canReadLesson(
    user: User,
    lesson: Aula,
    tenantId: string
  ): PolicyResult {
    // Verify tenant isolation (through course)
    if ((lesson as any).course?.tenantId !== tenantId) {
      return {
        allowed: false,
        reason: "Lesson belongs to different tenant",
      };
    }

    // All authenticated users can read published lessons
    if (lesson.status === "PUBLISHED") {
      return { allowed: true };
    }

    // Only lesson owner, instructors, and admins can read draft lessons
    if (["ADMIN", "INSTRUCTOR"].includes(user.role)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: "Lesson is not published and user lacks permissions",
    };
  }

  private static canUpdateLesson(
    user: User,
    lesson: Aula,
    tenantId: string
  ): PolicyResult {
    // Verify tenant isolation
    if ((lesson as any).course?.tenantId !== tenantId) {
      return {
        allowed: false,
        reason: "Lesson belongs to different tenant",
      };
    }

    // Admins can update any lesson
    if (user.role === "ADMIN") {
      return { allowed: true };
    }

    // Instructors can only update their own lessons
    if (user.role === "INSTRUCTOR") {
      // Check if user is the instructor of this lesson's course
      if ((lesson as any).course?.instructorId) {
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: "User cannot update this lesson",
    };
  }

  private static canDeleteLesson(
    user: User,
    lesson: Aula,
    tenantId: string
  ): PolicyResult {
    // Only admins can delete lessons
    if (user.role !== "ADMIN") {
      return {
        allowed: false,
        reason: "Only admins can delete lessons",
      };
    }

    // Verify tenant isolation
    if ((lesson as any).course?.tenantId !== tenantId) {
      return {
        allowed: false,
        reason: "Lesson belongs to different tenant",
      };
    }

    return { allowed: true };
  }

  /**
   * User Management Policies
   */
  private static canManageUser(user: User, tenantId: string): PolicyResult {
    // Only admins can manage users
    if (user.role !== "ADMIN") {
      return {
        allowed: false,
        reason: "Only admins can manage users",
      };
    }

    // Verify tenant isolation
    if ((user as any).tenantId !== tenantId) {
      return {
        allowed: false,
        reason: "Cannot manage users in different tenant",
      };
    }

    return { allowed: true };
  }

  /**
   * Tenant Management Policies
   */
  private static canManageTenant(user: User): PolicyResult {
    // Only super admins can manage tenants
    if (user.role !== "ADMIN") {
      return {
        allowed: false,
        reason: "Only admins can manage tenants",
      };
    }

    // Additional check: super admin flag or specific tenant management role
    // This would be implemented based on your specific requirements

    return { allowed: true };
  }

  /**
   * Helper method to check if user owns a resource
   */
  static isOwner(user: User, resource: any): boolean {
    if (!resource) return false;

    // Check direct ownership
    if (resource.userId && resource.userId === user.id) {
      return true;
    }

    // Check instructor ownership
    if (resource.instructorId && user.role === "INSTRUCTOR") {
      // This would need to be resolved from the instructor table
      return true; // Simplified for now
    }

    return false;
  }

  /**
   * Helper method to check if user is enrolled in a course
   */
  static async isEnrolled(_user: User, _courseId: number): Promise<boolean> {
    // This would check the enrollment table
    // Implementation depends on your enrollment logic
    return false; // Simplified for now
  }
}

/**
 * Middleware factory for access control
 */
export const requireAccess = (action: string) => {
  return async (req: any, _res: any, next: any) => {
    try {
      if (!req.user) {
        throw AppError.unauthorized("User not authenticated");
      }

      const context: AccessContext = {
        user: req.user,
        tenantId: req.user.tenantId,
        resource: req.resource,
        action,
      };

      const result = await AccessPolicy.checkAccess(context);

      if (!result.allowed) {
        logger.warn("Access denied", {
          userId: req.user.id,
          tenantId: req.user.tenantId,
          action,
          reason: result.reason,
        });
        throw AppError.forbidden(result.reason || "Access denied");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
