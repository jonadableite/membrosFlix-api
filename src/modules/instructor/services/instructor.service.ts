import { InstructorRepository } from "../repositories/instructor.repository";
import type {
  CreateInstructorDTO,
  UpdateInstructorDTO,
} from "../dtos/instructor.dto";
import { AppError } from "@/shared/errors/app.error";
import type { Instructor } from "@prisma/client";

export class InstructorService {
  constructor(private instructorRepository: InstructorRepository) {}

  /**
   * List all instructors
   */
  async listInstructors(tenantId?: string): Promise<Instructor[]> {
    return this.instructorRepository.listInstructors(tenantId);
  }

  /**
   * Get instructor by ID
   */
  async getInstructor(id: number, tenantId?: string): Promise<Instructor> {
    const where: any = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const instructor = await this.instructorRepository.findUnique({
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
        courses: true,
      },
    });

    if (!instructor) {
      throw AppError.notFound("Instrutor não encontrado");
    }

    return instructor;
  }

  /**
   * Get instructor by user ID
   */
  async getInstructorByUserId(
    userId: string,
    tenantId?: string
  ): Promise<Instructor | null> {
    return this.instructorRepository.findByUserId(userId, tenantId);
  }

  /**
   * Create instructor
   */
  async createInstructor(
    data: CreateInstructorDTO,
    tenantId: string
  ): Promise<Instructor> {
    // Check if user already has instructor profile
    const existing = await this.instructorRepository.findByUserId(
      data.userId,
      tenantId
    );

    if (existing) {
      throw AppError.badRequest("Usuário já possui perfil de instrutor");
    }

    return this.instructorRepository.create({
      data: {
        userId: data.userId,
        bio: data.bio,
        expertise: data.expertise || [],
        tenantId,
      },
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
   * Update instructor
   */
  async updateInstructor(
    id: number,
    data: UpdateInstructorDTO,
    tenantId?: string
  ): Promise<Instructor> {
    // Verify instructor exists
    await this.getInstructor(id, tenantId);

    const where: any = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.instructorRepository.update({
      where,
      data: {
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.expertise && { expertise: data.expertise }),
      },
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
   * Delete instructor
   */
  async deleteInstructor(id: number, tenantId?: string): Promise<void> {
    // Verify instructor exists
    await this.getInstructor(id, tenantId);

    const where: any = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    await this.instructorRepository.delete({ where });
  }
}
