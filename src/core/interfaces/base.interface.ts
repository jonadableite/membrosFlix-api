export interface BaseEntity {
  id: string | number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Repository<T extends BaseEntity> {
  findById(id: string | number): Promise<T | null>;
  findMany(options?: FindManyOptions<T>): Promise<T[]>;
  create(data: CreateData<T>): Promise<T>;
  update(id: string | number, data: UpdateData<T>): Promise<T>;
  delete(id: string | number): Promise<void>;
  prisma: any; // Expõe prisma para acesso direto quando necessário
}

export interface Service<T extends BaseEntity> {
  findById(id: string | number): Promise<T | null>;
  findMany(options?: FindManyOptions<T>): Promise<T[]>;
  create(data: CreateData<T>): Promise<T>;
  update(id: string | number, data: UpdateData<T>): Promise<T>;
  delete(id: string | number): Promise<void>;
}

export interface Controller {
  index?(req: Request, res: Response): Promise<Response>;
  show?(req: Request, res: Response): Promise<Response>;
  store?(req: Request, res: Response): Promise<Response>;
  update?(req: Request, res: Response): Promise<Response>;
  destroy?(req: Request, res: Response): Promise<Response>;
}

export type CreateData<T> = Omit<T, "id" | "createdAt" | "updatedAt">;
export type UpdateData<T> = Partial<CreateData<T>>;

export interface FindManyOptions<T> {
  where?: Partial<T>;
  orderBy?: Record<keyof T, "asc" | "desc">;
  skip?: number;
  take?: number;
  include?: Record<string, boolean>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
