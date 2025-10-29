import type { PrismaClient } from "@prisma/client";
import type {
  BaseEntity,
  Repository,
  FindManyOptions,
  CreateData,
  UpdateData,
} from "@/core/interfaces/base.interface";

export abstract class BaseRepository<T extends BaseEntity>
  implements Repository<T>
{
  public prisma: PrismaClient; // Público para acesso dos services quando necessário
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  protected get model() {
    return (this.prisma as any)[this.modelName];
  }

  async findById(id: string | number): Promise<T | null> {
    return await this.model.findUnique({
      where: { id },
    });
  }

  async findMany(options: FindManyOptions<T> = {}): Promise<T[]> {
    const { where, orderBy, skip, take, include } = options;

    return await this.model.findMany({
      where,
      orderBy,
      skip,
      take,
      include,
    });
  }

  // Multi-tenant aware methods
  async findManyByTenant(
    tenantId: string,
    options: FindManyOptions<T> = {}
  ): Promise<T[]> {
    const { where, orderBy, skip, take, include } = options;

    return await this.model.findMany({
      where: {
        ...where,
        tenantId,
      },
      orderBy,
      skip,
      take,
      include,
    });
  }

  async findByIdAndTenant(
    id: string | number,
    tenantId: string
  ): Promise<T | null> {
    return await this.model.findUnique({
      where: {
        id,
        tenantId,
      },
    });
  }

  async create(data: CreateData<T>): Promise<T> {
    return await this.model.create({
      data,
    });
  }

  async update(id: string | number, data: UpdateData<T>): Promise<T> {
    return await this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string | number): Promise<void> {
    await this.model.delete({
      where: { id },
    });
  }

  async count(where?: Partial<T>): Promise<number> {
    return await this.model.count({ where });
  }

  async exists(id: string | number): Promise<boolean> {
    const count = await this.model.count({
      where: { id },
    });
    return count > 0;
  }
}
