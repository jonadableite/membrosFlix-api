/**
 * @fileoverview Like Simple Service
 * @description Implementação simplificada do serviço de likes
 */

import { prisma } from "../../../shared/database/prisma";
import { AppEventEmitter } from "../../../shared/events/event.emitter";

export class LikeSimpleService {
  async toggleLessonLike(
    userId: string,
    aulaId: number
  ): Promise<{ liked: boolean; likesCount: number }> {
    try {
      // Verificar se já existe like
      const existingLike = await prisma.like.findFirst({
        where: {
          userId,
          aulaId,
        },
      });

      if (existingLike) {
        // Remover like existente
        await prisma.like.delete({
          where: { id: existingLike.id },
        });
      } else {
        // Criar novo like
        await prisma.like.create({
          data: {
            userId,
            aulaId,
          },
        });

        // 🔔 Enviar notificação ao dono da aula (instrutor)
        try {
          const aula = await prisma.aula.findUnique({
            where: { id: aulaId },
            include: {
              curso: {
                select: {
                  instructorId: true,
                },
              },
            },
          });

          const liker = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
          });

          if (aula?.curso?.instructorId && aula.curso.instructorId !== userId) {
            // Criar notificação para o instrutor
            await prisma.notification.create({
              data: {
                userId: aula.curso.instructorId,
                tipo: "NOVA_CURTIDA",
                mensagem: `${liker?.name || "Alguém"} curtiu sua aula "${aula.name}"`,
                dados: {
                  aulaId,
                  userId,
                  aulaName: aula.name,
                },
                lida: false,
              },
            });

            // Emitir evento para notificação em tempo real
            const event = AppEventEmitter.createEvent(
              "like.created",
              process.env.DEFAULT_TENANT_ID || "",
              aula.curso.instructorId,
              {
                aulaId,
                userId,
                userName: liker?.name,
              }
            );
            await AppEventEmitter.getInstance().emit(event);
          }
        } catch (notificationError) {
          // Ignorar erro de notificação para não bloquear o like
          console.error(
            "Erro ao criar notificação de like:",
            notificationError
          );
        }
      }

      // Contar total de likes
      const likesCount = await prisma.like.count({
        where: { aulaId },
      });

      return {
        liked: !existingLike,
        likesCount,
      };
    } catch (error) {
      throw new Error(`Erro ao alternar like: ${error}`);
    }
  }

  async toggleCommentLike(
    userId: string,
    commentId: number
  ): Promise<{ liked: boolean; likesCount: number }> {
    try {
      // Verificar se já existe like
      const existingLike = await prisma.like.findFirst({
        where: {
          userId,
          commentId,
        },
      });

      if (existingLike) {
        // Remover like existente
        await prisma.like.delete({
          where: { id: existingLike.id },
        });
      } else {
        // Criar novo like
        await prisma.like.create({
          data: {
            userId,
            commentId,
          },
        });

        // 🔔 Enviar notificação ao autor do comentário
        try {
          const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: {
              userId: true,
              content: true,
            },
          });

          const liker = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
          });

          if (comment && comment.userId !== userId) {
            // Criar notificação para o autor do comentário
            await prisma.notification.create({
              data: {
                userId: comment.userId,
                tipo: "NOVA_CURTIDA",
                mensagem: `${liker?.name || "Alguém"} curtiu seu comentário`,
                dados: {
                  commentId,
                  userId,
                  commentPreview: comment.content.substring(0, 50),
                },
                lida: false,
              },
            });

            // Emitir evento para notificação em tempo real
            const event = AppEventEmitter.createEvent(
              "comment.liked",
              process.env.DEFAULT_TENANT_ID || "",
              comment.userId,
              {
                commentId,
                userId,
                userName: liker?.name,
              }
            );
            await AppEventEmitter.getInstance().emit(event);
          }
        } catch (notificationError) {
          // Ignorar erro de notificação para não bloquear o like
          console.error(
            "Erro ao criar notificação de like em comentário:",
            notificationError
          );
        }
      }

      // Contar total de likes
      const likesCount = await prisma.like.count({
        where: { commentId },
      });

      return {
        liked: !existingLike,
        likesCount,
      };
    } catch (error) {
      throw new Error(`Erro ao alternar like: ${error}`);
    }
  }
}
