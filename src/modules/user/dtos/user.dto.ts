import { z } from "zod";
import type { UserRole } from "../../../core/types/common.types";

export const createUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  email: z.string().email("E-mail inválido").max(255, "E-mail muito longo"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["USER", "ADMIN", "INSTRUCTOR", "STUDENT"]).default("USER"),
  profilePicture: z.string().url("URL da foto inválida").optional(),
  bio: z.string().max(1000, "Bio muito longa").optional(),
  referralCode: z.string().optional(),
  referredBy: z.string().uuid("ID do referenciador inválido").optional(),
  status: z.boolean().default(true),
  tenantId: z.string().uuid("Tenant ID inválido").optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({
  password: true,
  referredBy: true,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(6, "A nova senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string | undefined;
  bio?: string | undefined;
  referralCode?: string | undefined;
  points: number;
  referralPoints: number;
  status: boolean;
  ultimoAcesso?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithStatsDto extends UserResponseDto {
  totalCourses: number;
  completedCourses: number;
  totalProgress: number;
  achievements: number;
}
