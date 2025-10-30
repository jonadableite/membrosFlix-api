/**
 * @fileoverview Comment Permission Checker - Simplified
 * @description Implementação simplificada do verificador de permissões para comentários
 */

import { 
  ICommentPermissionChecker, 
  ICommentRepository,
} from "../interfaces/comment.interface";

/**
 * @enum UserRole
 * @description Enum para definir papéis de usuário no sistema
 */
export enum UserRole {
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR", 
  INSTRUCTOR = "INSTRUCTOR",
  STUDENT = "STUDENT",
}

/**
 * @interface UserContext
 * @description Interface para contexto do usuário
 */
export interface UserContext {
  id: string;
  role: UserRole;
  tenantId?: string;
}

/**
 * @class CommentPermissionChecker
 * @description Implementação concreta do verificador de permissões de comentários
 */
export class CommentPermissionChecker implements ICommentPermissionChecker {
  constructor(private commentRepository: ICommentRepository) {}

  async canEdit(commentId: number, userId: string): Promise<boolean> {
    // Apenas o autor pode editar
    const comment = await this.commentRepository.findById(commentId);
    return comment?.userId === userId;
  }

  async canDelete(commentId: number, userId: string): Promise<boolean> {
    // Apenas o autor pode deletar
    const comment = await this.commentRepository.findById(commentId);
    return comment?.userId === userId;
  }

  async canReply(_parentId: number, userId: string): Promise<boolean> {
    // Todos os usuários autenticados podem responder
    return !!userId;
  }
}
