/**
 * @fileoverview Like Simple Service
 * @description Implementação simplificada do serviço de likes
 */

import { prisma } from "../../../shared/database/prisma";

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

          if (aula?.curso?.instructorId && aula.curso.instructorId.toString() !== userId) {
            // 🔔 DEBUG: Verificar dados da aula
            console.log("🔔 [LIKE LESSON] Dados da aula:", {
              aulaId,
              courseId: aula.courseId,
              instructorId: aula.curso.instructorId,
            });

            // Criar notificação para o instrutor
            await prisma.notification.create({
              data: {
                userId: aula.curso.instructorId.toString(),
                tipo: "NOVA_CURTIDA",
                mensagem: `${liker?.name || "Alguém"} curtiu sua aula "${aula.name}"`,
                dados: {
                  aulaId: aulaId.toString(),
                  courseId: aula.courseId, // ✅ Incluir courseId para redirecionamento
                  userId,
                  aulaName: aula.name,
                },
                lida: false,
              },
            });

            console.log("🔔 [LIKE LESSON] Notificação criada com dados:", {
              aulaId,
              courseId: aula.courseId,
            });

            // TODO: Implementar evento específico para likes quando necessário
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
              aulaId: true, // ✅ Incluir aulaId
              cursoId: true, // ✅ Incluir cursoId
            },
          });

          const liker = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
          });

          if (comment && comment.userId !== userId) {
            // 🔔 DEBUG: Verificar dados do comentário
            console.log("🔔 [LIKE COMMENT] Dados do comentário:", {
              commentId,
              aulaId: comment.aulaId,
              cursoId: comment.cursoId,
              userId: comment.userId,
            });

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
                  aulaId: comment.aulaId, // ✅ Incluir para redirecionamento
                  courseId: comment.cursoId, // ✅ Incluir para redirecionamento
                },
                lida: false,
              },
            });

            console.log("🔔 [LIKE COMMENT] Notificação criada com dados:", {
              aulaId: comment.aulaId,
              courseId: comment.cursoId,
            });

            // TODO: Implementar evento específico para comment likes quando necessário
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
