import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { BaseService } from '@/core/base/base.service';
import { AppError } from '@/shared/errors/app.error';
import type { UserRepository } from '../repositories/user.repository';
import type { CreateUserDto, UserResponseDto, UserWithStatsDto } from '../dtos/user.dto';
import type { FindManyOptions, CreateData, UpdateData } from '@/core/interfaces/base.interface';

export interface UserService {
  // Base service methods
  findById(id: string): Promise<User | null>;
  findByIdOrThrow(id: string): Promise<User>;
  findMany(options?: FindManyOptions<User>): Promise<User[]>;
  create(data: CreateData<User>): Promise<User>;
  update(id: string, data: UpdateData<User>): Promise<User>;
  delete(id: string): Promise<void>;
  
  // User-specific methods
  createUser(data: CreateUserDto): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByReferralCode(referralCode: string): Promise<User | null>;
  updateLastAccess(id: string): Promise<void>;
  changePassword(id: string, currentPassword: string, newPassword: string): Promise<void>;
  incrementPoints(id: string, points: number): Promise<User>;
  incrementReferralPoints(id: string, points: number): Promise<User>;
  findUsersWithStats(options?: {
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<UserWithStatsDto[]>;
  toResponseDto(user: User): UserResponseDto;
}

export class UserServiceImpl extends BaseService<User> implements UserService {
  constructor(private userRepository: UserRepository) {
    super(userRepository, 'User');
  }

  async createUser(data: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw AppError.conflict('E-mail já está em uso');
    }

    // Check if referral code already exists (if provided)
    if (data.referralCode) {
      const existingReferralCode = await this.userRepository.findByReferralCode(data.referralCode);
      if (existingReferralCode) {
        throw AppError.conflict('Código de referência já está em uso');
      }
    }

    // Validate referrer exists (if provided)
    if (data.referredBy) {
      const referrer = await this.userRepository.findById(data.referredBy);
      if (!referrer) {
        throw AppError.badRequest('Usuário referenciador não encontrado');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Generate unique ID and referral code if not provided
    const userId = uuidv4();
    const referralCode = data.referralCode || this.generateReferralCode();

    // Get or use default tenant ID
    const tenantId = data.tenantId || process.env.DEFAULT_TENANT_ID;
    if (!tenantId) {
      throw AppError.badRequest('Tenant ID é obrigatório');
    }

    const userData = {
      id: userId,
      tenantId,
      name: data.name,
      email: data.email,
      role: data.role,
      profilePicture: data.profilePicture,
      bio: data.bio,
      referralCode,
      referredBy: data.referredBy,
      status: data.status,
      passwordHash,
    };

    const user = await this.userRepository.create(userData as any);

    // Award referral points to referrer
    if (data.referredBy) {
      await this.incrementReferralPoints(data.referredBy, 100);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw AppError.badRequest('E-mail é obrigatório');
    }

    return await this.userRepository.findByEmail(email);
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    if (!referralCode) {
      throw AppError.badRequest('Código de referência é obrigatório');
    }

    return await this.userRepository.findByReferralCode(referralCode);
  }

  async updateLastAccess(id: string): Promise<void> {
    await this.userRepository.updateLastAccess(id);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findByIdOrThrow(id);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw AppError.badRequest('Senha atual incorreta');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await this.userRepository.update(id, { passwordHash: newPasswordHash } as any);
  }

  async incrementPoints(id: string, points: number): Promise<User> {
    if (points <= 0) {
      throw AppError.badRequest('Pontos devem ser maior que zero');
    }

    return await this.userRepository.incrementPoints(id, points);
  }

  async incrementReferralPoints(id: string, points: number): Promise<User> {
    if (points <= 0) {
      throw AppError.badRequest('Pontos de referência devem ser maior que zero');
    }

    return await this.userRepository.incrementReferralPoints(id, points);
  }

  async findUsersWithStats(options: {
    skip?: number;
    take?: number;
    search?: string;
  } = {}): Promise<UserWithStatsDto[]> {
    const users = await this.userRepository.findUsersWithStats(options);

    return users.map(user => ({
      ...this.toResponseDto(user),
      totalCourses: 0, // This would need to be calculated based on enrollments
      completedCourses: 0, // This would need to be calculated based on progress
      totalProgress: user._count.progress,
      achievements: user._count.achievements,
    }));
  }

  toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      profilePicture: user.profilePicture || undefined,
      bio: user.bio || undefined,
      referralCode: user.referralCode || undefined,
      points: user.points,
      referralPoints: user.referralPoints,
      status: user.status ?? true,
      ultimoAcesso: user.ultimoAcesso || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  protected override async validateCreate(_data: any): Promise<void> {
    // Additional business validation can be added here
  }

  protected override async validateUpdate(_id: string, _data: any): Promise<void> {
    // Additional business validation can be added here
  }

  protected override async validateDelete(_id: string): Promise<void> {
    // Check if user has active enrollments or other dependencies
    // This would prevent deletion of users with important data
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}