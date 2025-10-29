import { AccessPolicy } from "../../src/shared/policies/access.policy";
import type { User, Curso, Aula } from "@prisma/client";

describe("AccessPolicy", () => {
  const mockTenantId = "tenant-123";
  const mockOtherTenantId = "tenant-456";

  const mockStudent: User = {
    id: "student-1",
    tenantId: mockTenantId,
    name: "Student User",
    email: "student@test.com",
    passwordHash: "hashed",
    profilePicture: null,
    bio: null,
    role: "STUDENT",
    status: true,
    ultimoAcesso: null,
    referralCode: null,
    referredBy: null,
    points: 0,
    referralPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockInstructor: User = {
    id: "instructor-1",
    tenantId: mockTenantId,
    name: "Instructor User",
    email: "instructor@test.com",
    passwordHash: "hashed",
    profilePicture: null,
    bio: null,
    role: "INSTRUCTOR",
    status: true,
    ultimoAcesso: null,
    referralCode: null,
    referredBy: null,
    points: 0,
    referralPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockAdmin: User = {
    id: "admin-1",
    tenantId: mockTenantId,
    name: "Admin User",
    email: "admin@test.com",
    passwordHash: "hashed",
    profilePicture: null,
    bio: null,
    role: "ADMIN",
    status: true,
    ultimoAcesso: null,
    referralCode: null,
    referredBy: null,
    points: 0,
    referralPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockCourse: Curso = {
    id: 1,
    tenantId: mockTenantId,
    title: "Test Course",
    description: "Test Description",
    path: null,
    thumbnail: null,
    status: "PUBLISHED",
    totalAulas: 0,
    duracaoTotal: null,
    instructorId: 1,
    price: null,
    category: null,
    level: null,
    tags: [],
    slug: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Curso;

  const mockLesson: Aula = {
    id: 1,
    name: "Test Lesson",
    description: "Test Description",
    duration: 60,
    path: "/path/to/lesson",
    thumbnail: null,
    courseId: 1,
    ordemAula: 1,
    instructorId: "instructor-1",
    status: "PUBLISHED",
    isPreview: false,
    materials: [],
    videoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Aula;

  describe("Course Access", () => {
    it("should allow students to read published courses", async () => {
      const result = await AccessPolicy.checkAccess({
        user: mockStudent,
        tenantId: mockTenantId,
        resource: mockCourse,
        action: "course.read",
      });

      expect(result.allowed).toBe(true);
    });

    it("should deny students from creating courses", async () => {
      const result = await AccessPolicy.checkAccess({
        user: mockStudent,
        tenantId: mockTenantId,
        action: "course.create",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain(
        "Only instructors and admins can create courses"
      );
    });

    it("should allow instructors to create courses", async () => {
      const result = await AccessPolicy.checkAccess({
        user: mockInstructor,
        tenantId: mockTenantId,
        action: "course.create",
      });

      expect(result.allowed).toBe(true);
    });

    it("should deny cross-tenant access", async () => {
      const result = await AccessPolicy.checkAccess({
        user: mockStudent,
        tenantId: mockOtherTenantId,
        resource: mockCourse,
        action: "course.read",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Cross-tenant access not allowed");
    });
  });

  describe("Lesson Access", () => {
    it("should allow students to read published lessons", async () => {
      const result = await AccessPolicy.checkAccess({
        user: mockStudent,
        tenantId: mockTenantId,
        resource: { ...mockLesson, course: mockCourse },
        action: "lesson.read",
      });

      expect(result.allowed).toBe(true);
    });

    it("should deny students from creating lessons", async () => {
      const result = await AccessPolicy.checkAccess({
        user: mockStudent,
        tenantId: mockTenantId,
        resource: mockCourse,
        action: "lesson.create",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain(
        "Only instructors and admins can create lessons"
      );
    });

    it("should allow instructors to create lessons", async () => {
      const result = await AccessPolicy.checkAccess({
        user: mockInstructor,
        tenantId: mockTenantId,
        resource: mockCourse,
        action: "lesson.create",
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe("User Management", () => {
    it("should deny students from managing users", async () => {
      const result = await AccessPolicy.checkAccess({
        user: mockStudent,
        tenantId: mockTenantId,
        action: "user.manage",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Only admins can manage users");
    });

    it("should allow admins to manage users", async () => {
      const result = await AccessPolicy.checkAccess({
        user: mockAdmin,
        tenantId: mockTenantId,
        action: "user.manage",
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe("Tenant Management", () => {
    it("should deny non-admins from managing tenants", async () => {
      const result = await AccessPolicy.checkAccess({
        user: mockStudent,
        tenantId: mockTenantId,
        action: "tenant.manage",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Only admins can manage tenants");
    });

    it("should allow admins to manage tenants", async () => {
      const result = await AccessPolicy.checkAccess({
        user: mockAdmin,
        tenantId: mockTenantId,
        action: "tenant.manage",
      });

      expect(result.allowed).toBe(true);
    });
  });
});
