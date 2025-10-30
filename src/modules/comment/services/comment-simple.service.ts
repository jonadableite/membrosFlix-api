/**
 * @fileoverview Comment Simple Service
 * @description Implementação simplificada do serviço de comentários
 */

import { prisma } from '../../../shared/database/prisma.js';
import { AppEventEmitter } from '../../../shared/events/event.emitter.js';

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
  likesCount: number;
  repliesCount: number;
  userLiked?: boolean;
  replies?: CommentResponseDto[];
}

export class CommentSimpleService {
  /**
   * 🔍 Buscar comentário por ID
   * (Usado para redirecionamento de notificações)
   */
  async getCommentById(commentId: number): Promise<CommentResponseDto | null> {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          likes: true,
        },
      });

      if (!comment) {
        return null;
      }

      return {
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        aulaId: comment.aulaId || undefined,
        cursoId: comment.cursoId || undefined,
        parentId: comment.parentId || undefined,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user,
        likesCount: comment.likes?.length || 0,
        repliesCount: 0,
      };
    } catch (error) {
      console.error("Erro ao buscar comentário por ID:", error);
      throw new Error(`Erro ao buscar comentário: ${error}`);
    }
  }

  async createComment(data: CreateCommentDto): Promise<CommentResponseDto> {
    try {
      const comment = await prisma.comment.create({
        data: {
          content: data.content,
          userId: data.userId,
          aulaId: data.aulaId || null,
          cursoId: data.cursoId || null,
          parentId: data.parentId || null,
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
            select: {
              userId: true,
              aulaId: true, // ✅ Buscar aulaId do comentário pai
              cursoId: true, // ✅ Buscar cursoId do comentário pai
            },
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
                  aulaId: parentComment.aulaId, // ✅ Incluir para redirecionamento
                  courseId: parentComment.cursoId, // ✅ Incluir para redirecionamento
                },
                lida: false,
              },
            });

            // TODO: Implementar evento específico para replies quando necessário
            console.log("🔔 [REPLY] Resposta criada para comentário do usuário:", parentComment.userId);
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
                tipo: "NOVO_COMENTARIO",
                mensagem: `${comment.user?.name || "Alguém"} comentou na aula "${aula.name}"`,
                dados: {
                  aulaId: data.aulaId,
                  commentId: comment.id,
                  preview: data.content.substring(0, 50),
                  courseId: aula.courseId, // ✅ Incluir para redirecionamento
                },
                lida: false,
              },
            });

            // TODO: Implementar evento específico para comentários em aulas quando necessário
            console.log("🔔 [COMMENT] Comentário criado na aula:", data.aulaId);
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
              id: comment.user.id,
              name: comment.user.name,
              email: comment.user.email,
              profilePicture: comment.user.profilePicture ?? undefined,
            }
          : undefined,
        likesCount: comment.likes?.length || 0, // ✅ Contador real
        repliesCount: 0,
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

      if (comments[0]) {
        console.log("📊 Primeiro comentário ID:", comments[0].id);
        console.log(
          "📊 Primeiro comentário tem likes?",
          comments[0].likes?.length || 0
        );
        console.log(
          "📊 Primeiro comentário tem replies?",
          (comments[0] as any).replies?.length || 0
        );

        // Log completo do primeiro comentário
        const firstComment = comments[0] as any;
        if (firstComment.replies && firstComment.replies.length > 0) {
          console.log(
            "📊 Primeira reply:",
            JSON.stringify(firstComment.replies[0], null, 2)
          );
        }
      }

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
              id: comment.user.id,
              name: comment.user.name,
              email: comment.user.email,
              profilePicture: comment.user.profilePicture ?? undefined,
            }
          : undefined,
        likesCount: comment.likes?.length || 0, // ✅ Contador real
        repliesCount: 0,
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
