import type { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/app.error.js';
import { asyncHandler } from '../../../shared/utils/async-handler.js';
import type { AuthenticatedRequest, ApiResponse } from '../../../core/types/common.types.js';
import type { AuthService } from '../services/auth.service.js';
import { 
  loginSchema, 
  registerSchema, 
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type AuthResponseDto 
} from '../dtos/auth.dto.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body);
    
    const result = await this.authService.login(validatedData);

    const response: ApiResponse<AuthResponseDto> = {
      success: true,
      message: 'Login realizado com sucesso',
      data: result
    };

    res.status(200).json(response);
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body);
    
    const result = await this.authService.register(validatedData);

    const response: ApiResponse<AuthResponseDto> = {
      success: true,
      message: 'Usuário registrado com sucesso',
      data: result
    };

    res.status(201).json(response);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    
    const result = await this.authService.refreshToken(refreshToken);

    const response: ApiResponse<AuthResponseDto> = {
      success: true,
      message: 'Token renovado com sucesso',
      data: result
    };

    res.status(200).json(response);
  });

  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized('Usuário não autenticado');
    }

    await this.authService.logout(req.user.id);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Logout realizado com sucesso',
      data: null
    };

    res.status(200).json(response);
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    
    await this.authService.forgotPassword(email);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Se o e-mail existir, um link de recuperação será enviado',
      data: null
    };

    res.status(200).json(response);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = resetPasswordSchema.parse(req.body);
    
    await this.authService.resetPassword(token, password);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Senha redefinida com sucesso',
      data: null
    };

    res.status(200).json(response);
  });

  me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized('Usuário não autenticado');
    }

    const response: ApiResponse<typeof req.user> = {
      success: true,
      message: 'Dados do usuário obtidos com sucesso',
      data: req.user
    };

    res.status(200).json(response);
  });

  validateToken = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Token não fornecido');
    }

    const token = authHeader.substring(7);
    const payload = await this.authService.validateToken(token);

    const response: ApiResponse<typeof payload> = {
      success: true,
      message: 'Token válido',
      data: payload
    };

    res.status(200).json(response);
  });
}