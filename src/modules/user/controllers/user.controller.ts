import type { Request, Response } from "express";
import { BaseController } from '../../../core/base/base.controller.js';
import type { User } from "@prisma/client";
import type { UserService } from '../services/user.service.js';
import type { AuthenticatedRequest } from '../../../core/types/common.types.js';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  type CreateUserDto,
  type UpdateUserDto,
} from '../dtos/user.dto.js';
import { asyncHandler } from '../../../shared/utils/async-handler.js';
import { AppError } from '../../../shared/errors/app.error.js';

export class UserController extends BaseController<User> {
  constructor(private userService: UserService) {
    super(userService, "User");
  }

  // Override store method to use custom user creation logic
  override store = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const data = await this.validateCreateData(req);

      const user = await this.userService.createUser(data);
      const responseData = this.userService.toResponseDto(user);

      return res.status(201).json({
        success: true,
        data: responseData,
        message: "Usuário criado com sucesso",
      });
    }
  );

  // Get user profile (authenticated user)
  profile = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
      const userId = req.user?.id;
      if (!userId) {
        throw AppError.unauthorized();
      }

      const user = await this.userService.findByIdOrThrow(userId);
      const responseData = this.userService.toResponseDto(user);

      return res.json({
        success: true,
        data: responseData,
      });
    }
  );

  // Update user profile (authenticated user)
  updateProfile = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
      const userId = req.user?.id;
      if (!userId) {
        throw AppError.unauthorized();
      }

      const data = await this.validateUpdateData(req);

      // Convert UpdateUserDto to UpdateData<User> format
      const updateData = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.profilePicture !== undefined && {
          profilePicture: data.profilePicture,
        }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.referralCode !== undefined && {
          referralCode: data.referralCode,
        }),
      };

      const user = await this.userService.update(userId, updateData as any);
      const responseData = this.userService.toResponseDto(user);

      return res.json({
        success: true,
        data: responseData,
        message: "Perfil atualizado com sucesso",
      });
    }
  );

  // Change password (authenticated user)
  changePassword = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
      const userId = req.user?.id;
      if (!userId) {
        throw AppError.unauthorized();
      }

      const { currentPassword, newPassword } = changePasswordSchema.parse(
        req.body
      );

      await this.userService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      return res.json({
        success: true,
        message: "Senha alterada com sucesso",
      });
    }
  );

  // Get users with statistics (admin only)
  usersWithStats = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const { page = 1, limit = 10, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const users = await this.userService.findUsersWithStats({
        skip,
        take,
        search: search as string,
      });

      return res.json({
        success: true,
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: users.length, // This should be the actual total count
          totalPages: Math.ceil(users.length / Number(limit)),
        },
      });
    }
  );

  // Find user by email
  findByEmail = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const { email } = req.params;

      if (!email) {
        throw AppError.badRequest("E-mail é obrigatório");
      }

      const user = await this.userService.findByEmail(email);

      if (!user) {
        throw AppError.notFound("Usuário não encontrado");
      }

      const responseData = this.userService.toResponseDto(user);

      return res.json({
        success: true,
        data: responseData,
      });
    }
  );

  // Find user by referral code
  findByReferralCode = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const { referralCode } = req.params;

      if (!referralCode) {
        throw AppError.badRequest("Código de referência é obrigatório");
      }

      const user = await this.userService.findByReferralCode(referralCode);

      if (!user) {
        throw AppError.notFound("Código de referência não encontrado");
      }

      const responseData = this.userService.toResponseDto(user);

      return res.json({
        success: true,
        data: responseData,
      });
    }
  );

  // Award points to user (admin only)
  awardPoints = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const { id } = req.params;
      const { points } = req.body;

      if (!id) {
        throw AppError.badRequest("ID do usuário é obrigatório");
      }

      if (!points || points <= 0) {
        throw AppError.badRequest("Pontos devem ser maior que zero");
      }

      const user = await this.userService.incrementPoints(id, points);
      const responseData = this.userService.toResponseDto(user);

      return res.json({
        success: true,
        data: responseData,
        message: `${points} pontos adicionados com sucesso`,
      });
    }
  );

  protected async validateCreateData(req: Request): Promise<CreateUserDto> {
    return createUserSchema.parse(req.body);
  }

  protected async validateUpdateData(req: Request): Promise<UpdateUserDto> {
    return updateUserSchema.parse(req.body);
  }
}
