import type { User } from "@prisma/client";
import { BaseRepository } from "../../../core/base/base.repository";
import { prisma } from "../../../shared/database/prisma";
import type { Repository } from "../../../core/interfaces/base.interface";

export interface UserRepository extends Repository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByReferralCode(referralCode: string): Promise<User | null>;
  updateLastAccess(id: string): Promise<void>;
  incrementPoints(id: string, points: number): Promise<User>;
  incrementReferralPoints(id: string, points: number): Promise<User>;
  findUsersWithStats(options?: {
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<
    Array<
      User & {
        _count: {
          progress: number;
          achievements: number;
        };
      }
    >
  >;
}

export class UserRepositoryImpl
  extends BaseRepository<User>
  implements UserRepository
{
  constructor() {
    super(prisma, "user");
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: {
        email_tenantId: {
          email,
          tenantId: "58ea5458-bf4b-43b3-8c86-9d3f4564b2d0",
        },
      },
    });
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { referralCode },
    });
  }

  async updateLastAccess(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { ultimoAcesso: new Date() },
    });
  }

  async incrementPoints(id: string, points: number): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        points: {
          increment: points,
        },
      },
    });
  }

  async incrementReferralPoints(id: string, points: number): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        referralPoints: {
          increment: points,
        },
      },
    });
  }

  async findUsersWithStats(
    options: {
      skip?: number;
      take?: number;
      search?: string;
    } = {}
  ): Promise<
    Array<
      User & {
        _count: {
          progress: number;
          achievements: number;
        };
      }
    >
  > {
    const { skip, take, search } = options;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    return (await prisma.user.findMany({
      where,
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
      include: {
        _count: {
          select: {
            progress: true,
            achievements: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })) as Array<
      User & {
        _count: {
          progress: number;
          achievements: number;
        };
      }
    >;
  }
}
