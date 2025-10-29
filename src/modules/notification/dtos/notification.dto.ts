import { z } from "zod";
import type { NotificationType } from "@prisma/client";

export interface NotificationResponseDto {
  id: string;
  userId: string;
  tipo: NotificationType;
  mensagem: string;
  dados?: any;
  lida: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface CreateNotificationDto {
  userId: string;
  tenantId: string;
  tipo: NotificationType;
  mensagem: string;
  dados?: any;
}

export interface UpdateNotificationDto {
  lida?: boolean;
  dados?: any;
}

export const createNotificationSchema = z.object({
  userId: z.string().uuid("ID do usuário deve ser um UUID válido"),
  tenantId: z.string().uuid("ID do tenant deve ser um UUID válido"),
  tipo: z.enum([
    "NOVA_AULA",
    "NOVO_COMENTARIO",
    "PROGRESSO",
    "CONQUISTA",
    "INDICACAO",
    "CURSO_NOVO",
    "MENSAGEM",
    "BOAS_VINDAS",
  ]),
  mensagem: z
    .string()
    .min(1, "Mensagem é obrigatória")
    .max(1000, "Mensagem muito longa"),
  dados: z.any().optional(),
});

export const updateNotificationSchema = z.object({
  lida: z.boolean().optional(),
  dados: z.any().optional(),
});
