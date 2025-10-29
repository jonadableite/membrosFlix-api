import type {
  BaseEntity,
  Service,
  Repository,
  FindManyOptions,
  CreateData,
  UpdateData,
} from "@/core/interfaces/base.interface";
import { AppError } from "@/shared/errors/app.error";

export abstract class BaseService<T extends BaseEntity> implements Service<T> {
  protected repository: Repository<T>;
  protected entityName: string;

  constructor(repository: Repository<T>, entityName: string) {
    this.repository = repository;
    this.entityName = entityName;
  }

  async findById(id: string | number): Promise<T | null> {
    if (!id) {
      throw new AppError(`${this.entityName} ID is required`, 400);
    }

    return await this.repository.findById(id);
  }

  async findByIdOrThrow(id: string | number): Promise<T> {
    const entity = await this.findById(id);

    if (!entity) {
      throw new AppError(`${this.entityName} not found`, 404);
    }

    return entity;
  }

  async findMany(options: FindManyOptions<T> = {}): Promise<T[]> {
    return await this.repository.findMany(options);
  }

  async create(data: CreateData<T>): Promise<T> {
    if (!data) {
      throw new AppError(`${this.entityName} data is required`, 400);
    }

    await this.validateCreate(data);
    return await this.repository.create(data);
  }

  async update(id: string | number, data: UpdateData<T>): Promise<T> {
    if (!id) {
      throw new AppError(`${this.entityName} ID is required`, 400);
    }

    if (!data || Object.keys(data).length === 0) {
      throw new AppError("Update data is required", 400);
    }

    await this.findByIdOrThrow(id);
    await this.validateUpdate(id, data);

    return await this.repository.update(id, data);
  }

  async delete(id: string | number): Promise<void> {
    if (!id) {
      throw new AppError(`${this.entityName} ID is required`, 400);
    }

    await this.findByIdOrThrow(id);
    await this.validateDelete(id);

    return await this.repository.delete(id);
  }

  protected async validateCreate(_data: CreateData<T>): Promise<void> {
    // Override in child classes for specific validation
  }

  protected async validateUpdate(
    _id: string | number,
    _data: UpdateData<T>
  ): Promise<void> {
    // Override in child classes for specific validation
  }

  protected async validateDelete(_id: string | number): Promise<void> {
    // Override in child classes for specific validation
  }
}
