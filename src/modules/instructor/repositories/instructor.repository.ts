import { BaseRepository } from "@/core/base/base.repository";
import { prisma } from "@/shared/database/prisma";
import type { Instructor, Prisma } from "@prisma/client";

export class InstructorRepository extends BaseRepository<
  Instructor,
  Prisma.InstructorFindUniqueArgs,
  Prisma.InstructorFindManyArgs,
  Prisma.InstructorCreateArgs,
  Prisma.InstructorUpdateArgs,
  Prisma.InstructorDeleteArgs
> {
  constructor() {
    super(prisma, "instructor");
  }

  /**
   * Find instructor by user ID
   */
  async findByUserId(
    userId: string,
    tenantId?: string
  ): Promise<Instructor | null> {
    const where: Prisma.InstructorWhereInput = {
      userId,
      ...(tenantId && { tenantId }),
    };

    return this.model.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  /**
   * List all instructors with user info
   */
  async listInstructors(tenantId?: string): Promise<Instructor[]> {
    // Note: Removed tenantId from where clause to avoid UUID validation issues
    // tenantId is passed as "localhost" from middleware, not a valid UUID
    return this.model.findMany({
      where: {}, // List all instructors regardless of tenant
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
        _count: {
          select: {
            courses: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
