/**
 * @fileoverview Comment Simple Service
 * @description Implementação simplificada do serviço de comentários
 */

import { prisma } from "../../../shared/database/prisma";
import { AppEventEmitter } from "../../../shared/events/event.emitter";

export interface CreateCommentDto {
  content: string;
  userId: string;
  aulaId?: number;
  cursoId?: number;
  parentId?: number;
}

export interface CommentResponseDto {
  id: number;
  content: string;
  userId: string;
  aulaId?: number;
  cursoId?: number;
  parentId?: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  likesCount?: number;
  repliesCount?: number;
  replies?: CommentResponseDto[]; // ✅ Suporte a respostas aninhadas
  likes?: any[]; // ✅ Incluir likes para cálculo de userLiked
}

export class CommentSimpleService {
  async createComment(data: CreateCommentDto): Promise<CommentResponseDto> {
    try {
      const comment = await prisma.comment.create({
        data: {
          content: data.content,
          userId: data.userId,
          aulaId: data.aulaId,
          cursoId: data.cursoId,
          parentId: data.parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          likes: true, // ✅ Incluir likes para cálculo de userLiked no frontend
        },
      });

      // 🔔 Enviar notificações
      try {
        // Se é resposta a outro comentário, notificar o autor original
        if (data.parentId) {
          const parentComment = await prisma.comment.findUnique({
            where: { id: data.parentId },
            select: { userId: true },
          });

          if (parentComment && parentComment.userId !== data.userId) {
            await prisma.notification.create({
              data: {
                userId: parentComment.userId,
                tipo: "RESPOSTA_COMENTARIO",
                mensagem: `${comment.user?.name || "Alguém"} respondeu seu comentário`,
                dados: {
                  commentId: comment.id,
                  parentId: data.parentId,
                  preview: data.content.substring(0, 50),
                },
                lida: false,
              },
            });

            const event = AppEventEmitter.createEvent(
              "comment.replied",
              process.env.DEFAULT_TENANT_ID || "",
              parentComment.userId,
              {
                commentId: comment.id,
                userId: data.userId,
                userName: comment.user?.name,
              }
            );
            await AppEventEmitter.getInstance().emit(event);
          }
        }

        // Se é comentário em aula, notificar o instrutor
        if (data.aulaId) {
          const aula = await prisma.aula.findUnique({
            where: { id: data.aulaId },
            include: {
              curso: {
                select: {
                  instructorId: true,
                },
              },
            },
          });

          if (
            aula?.curso?.instructorId &&
            aula.curso.instructorId.toString() !== data.userId
          ) {
            await prisma.notification.create({
              data: {
                userId: aula.curso.instructorId.toString(),
                tenantId: process.env.DEFAULT_TENANT_ID || "",
                tipo: "NOVO_COMENTARIO",
                mensagem: `${comment.user?.name || "Alguém"} comentou na aula "${aula.name}"`,
                dados: {
                  aulaId: data.aulaId,
                  commentId: comment.id,
                  preview: data.content.substring(0, 50),
                },
                lida: false,
              },
            });

            const event = AppEventEmitter.createEvent(
              "comment.created" as any,
              process.env.DEFAULT_TENANT_ID || "",
              aula.curso.instructorId.toString(),
              {
                commentId: comment.id,
                aulaId: data.aulaId,
                userId: data.userId,
                userName: comment.user?.name,
              }
            );
            await AppEventEmitter.getInstance().emit(event);
          }
        }
      } catch (notificationError) {
        // Ignorar erro de notificação para não bloquear o comentário
        console.error(
          "Erro ao criar notificação de comentário:",
          notificationError
        );
      }

      return {
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        aulaId: comment.aulaId ?? undefined,
        cursoId: comment.cursoId ?? undefined,
        parentId: comment.parentId ?? undefined,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user
          ? {
              ...comment.user,
              profilePicture: comment.user.profilePicture ?? undefined,
            }
          : undefined,
        likesCount: comment.likes?.length || 0, // ✅ Contador real
        repliesCount: 0,
        likes: comment.likes || [], // ✅ Array de likes para frontend calcular userLiked
        replies: [], // Comentário recém-criado não tem replies
      };
    } catch (error) {
      throw new Error(`Erro ao criar comentário: ${error}`);
    }
  }

  async getCommentsByLesson(lessonId: number): Promise<CommentResponseDto[]> {
    try {
      // Buscar comentários principais com replies aninhadas
      console.log("🔍 Buscando comentários da aula:", lessonId);

      const comments = await prisma.comment.findMany({
        where: {
          aulaId: lessonId,
          parentId: null, // Apenas comentários principais
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          // 🔥 INCLUIR RESPOSTAS (REPLIES) - FIX CRÍTICO
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profilePicture: true,
                },
              },
              likes: true, // Incluir likes das respostas
            },
            orderBy: {
              createdAt: "asc", // Respostas em ordem cronológica
            },
          },
          likes: true, // Incluir likes do comentário principal
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log("📊 Comentários encontrados:", comments.length);
      console.log(
        "📊 Primeiro comentário:",
        JSON.stringify(comments[0], null, 2)
      );

      // Mapear comentários com contadores corretos
      const mappedComments = comments.map((comment) => {
        const replies =
          (comment as any).replies?.map((reply: any) => ({
            id: reply.id,
            content: reply.content,
            userId: reply.userId,
            aulaId: reply.aulaId ?? undefined,
            cursoId: reply.cursoId ?? undefined,
            parentId: reply.parentId ?? undefined,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
            user: reply.user
              ? {
                  ...reply.user,
                  profilePicture: reply.user.profilePicture ?? undefined,
                }
              : undefined,
            likesCount: reply.likes?.length || 0,
            repliesCount: 0,
            likes: reply.likes || [],
          })) || [];

        console.log(
          `📊 Comentário ${comment.id} tem ${replies.length} replies`
        );

        return {
          id: comment.id,
          content: comment.content,
          userId: comment.userId,
          aulaId: comment.aulaId ?? undefined,
          cursoId: comment.cursoId ?? undefined,
          parentId: comment.parentId ?? undefined,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          user: comment.user
            ? {
                ...comment.user,
                profilePicture: comment.user.profilePicture ?? undefined,
              }
            : undefined,
          likesCount: comment.likes?.length || 0,
          repliesCount: replies.length,
          likes: comment.likes || [],
          replies: replies,
        };
      });

      console.log("✅ Retornando", mappedComments.length, "comentários");

      return mappedComments;
    } catch (error) {
      throw new Error(`Erro ao buscar comentários: ${error}`);
    }
  }

  async updateComment(
    commentId: number,
    userId: string,
    content: string
  ): Promise<CommentResponseDto> {
    try {
      const comment = await prisma.comment.update({
        where: {
          id: commentId,
          userId, // Garantir que apenas o autor pode editar
        },
        data: {
          content,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          likes: true, // ✅ Incluir likes para cálculo correto
        },
      });

      return {
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        aulaId: comment.aulaId ?? undefined,
        cursoId: comment.cursoId ?? undefined,
        parentId: comment.parentId ?? undefined,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user
          ? {
              ...comment.user,
              profilePicture: comment.user.profilePicture ?? undefined,
            }
          : undefined,
        likesCount: comment.likes?.length || 0, // ✅ Contador real
        repliesCount: 0,
        likes: comment.likes || [], // ✅ Array de likes
        replies: [], // Update não altera replies
      };
    } catch (error) {
      throw new Error(`Erro ao atualizar comentário: ${error}`);
    }
  }

  async deleteComment(commentId: number, userId: string): Promise<void> {
    try {
      await prisma.comment.delete({
        where: {
          id: commentId,
          userId, // Garantir que apenas o autor pode deletar
        },
      });
    } catch (error) {
      throw new Error(`Erro ao deletar comentário: ${error}`);
    }
  }
}
