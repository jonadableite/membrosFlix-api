import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../../../shared/errors/app.error";
import { env } from "../../../config/env";
import type { UserService } from "../../../modules/user/services/user.service";
import type {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  TokenPayload,
  PasswordResetToken,
} from "../dtos/auth.dto";
import type { JwtPayload } from "../../../core/types/common.types";
import { AppEventEmitter } from "../../../shared/events/event.emitter";
import { prisma } from "../../../shared/database/prisma";
import { emailService } from "../../../shared/email/email.service";

export interface AuthService {
  login(data: LoginDto): Promise<AuthResponseDto>;
  register(data: RegisterDto): Promise<AuthResponseDto>;
  refreshToken(refreshToken: string): Promise<AuthResponseDto>;
  logout(userId: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  validateToken(token: string): Promise<JwtPayload>;
}

export class AuthServiceImpl implements AuthService {
  private refreshTokens = new Map<string, string>(); // In production, use Redis
  private passwordResetTokens = new Map<string, PasswordResetToken>(); // Legacy fallback (não usado em produção)

  constructor(private userService: UserService) {}

  async login(data: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = data;

    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw AppError.unauthorized("Credenciais inválidas");
    }

    // Check if user is active
    if (!user.status) {
      throw AppError.forbidden("Conta desativada");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized("Credenciais inválidas");
    }

    // Update last access
    await this.userService.updateLastAccess(user.id);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    this.refreshTokens.set(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as any,
        ...(user.profilePicture && { profilePicture: user.profilePicture }),
      },
      tokens,
    };
  }

  async register(data: RegisterDto): Promise<AuthResponseDto> {
    const { name, email, password, referralCode } = data;

    // Check if referral code exists
    let referredBy: string | undefined;
    if (referralCode) {
      const referrer = await this.userService.findByReferralCode(referralCode);
      if (!referrer) {
        throw AppError.badRequest("Código de referência inválido");
      }
      referredBy = referrer.id;
    }

    // Get tenant ID from environment or use default
    const tenantId = process.env.DEFAULT_TENANT_ID;
    if (!tenantId) {
      throw AppError.internal(
        "Tenant ID não configurado. Configure DEFAULT_TENANT_ID no arquivo .env"
      );
    }

    // Create user
    const user = await this.userService.createUser({
      name,
      email,
      password,
      role: "STUDENT",
      referredBy,
      status: true,
      tenantId,
    });

    // Emit user registered event for welcome notification
    const event = AppEventEmitter.createEvent(
      "user.registered",
      tenantId,
      user.id,
      {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
      }
    );
    await AppEventEmitter.getInstance().emit(event);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    this.refreshTokens.set(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as any,
        ...(user.profilePicture && { profilePicture: user.profilePicture }),
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, env.JWT_SECRET!) as TokenPayload;

      if (payload.type !== "refresh") {
        throw AppError.unauthorized("Token inválido");
      }

      // Check if refresh token is stored
      const storedToken = this.refreshTokens.get(payload.id);
      if (!storedToken || storedToken !== refreshToken) {
        throw AppError.unauthorized("Token inválido");
      }

      // Get user
      const user = await this.userService.findByIdOrThrow(payload.id);

      // Check if user is active
      if (!user.status) {
        throw AppError.forbidden("Conta desativada");
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Update stored refresh token
      this.refreshTokens.set(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as any,
          ...(user.profilePicture && { profilePicture: user.profilePicture }),
        },
        tokens,
      };
    } catch (error) {
      throw AppError.unauthorized("Token inválido");
    }
  }

  async logout(userId: string): Promise<void> {
    // Remove refresh token
    this.refreshTokens.delete(userId);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      // Não revelar existência do e-mail
      return;
    }

    // Invalida tokens antigos
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Gera novo token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    const frontendUrl = env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await emailService.sendEmail({
      to: user.email,
      subject: "Recuperação de senha - MembrosFlix",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3177fa;">Recuperar senha</h2>
          <p>Olá ${user.name},</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para continuar:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3177fa; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Redefinir senha</a>
          </div>
          <p>Se você não solicitou, ignore este e-mail.</p>
          <p style="color:#6b7280; font-size:12px;">O link expira em 1 hora.</p>
        </div>
      `,
      text: `Olá ${user.name},\n\nAcesse o link para redefinir sua senha: ${resetUrl}\n\nO link expira em 1 hora. Se não foi você, ignore este e-mail.`,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (!record || record.expiresAt < new Date() || record.usedAt) {
      throw AppError.badRequest("Token inválido ou expirado");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET!) as TokenPayload;

      if (payload.type !== "access") {
        throw AppError.unauthorized("Token inválido");
      }

      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
      };
    } catch (error) {
      throw AppError.unauthorized("Token inválido");
    }
  }

  private generateTokens(user: User) {
    const payload: Omit<TokenPayload, "type"> = {
      id: user.id,
      email: user.email,
      role: user.role as any,
      tenantId: (user as any).tenantId || "default-tenant",
    };

    const accessToken = jwt.sign(
      { ...payload, type: "access" },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN || "1h" } as any
    );

    const refreshToken = jwt.sign(
      { ...payload, type: "refresh" },
      env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpirationTime(env.JWT_EXPIRES_IN),
    };
  }

  private getTokenExpirationTime(expiresIn: string): number {
    // Convert JWT expiration string to seconds
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match || !match[1]) return 3600; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 24 * 60 * 60;
      default:
        return 3600;
    }
  }
}
