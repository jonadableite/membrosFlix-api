/**
 * @fileoverview Comment Write Interface
 * @description Interface específica para operações de escrita de comentários
 * 
 * SOLID PRINCIPLE: Interface Segregation Principle (ISP)
 * - Interface focada apenas em operações de escrita
 * - Clientes que precisam apenas escrever dados não dependem de operações de leitura
 * - Permite implementações otimizadas para escrita (ex: write-through cache)
 */

import type { 
  CreateCommentData, 
  UpdateCommentData, 
  CommentWithRelations,
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto
} from './comment.interface.js';

/**
 * @interface ICommentWriteRepository
 * @description Interface específica para operações de escrita de comentários
 * 
 * SOLID: ISP - Segregação de operações de escrita
 * - Permite implementações otimizadas para persistência
 * - Clientes write-only não dependem de métodos de leitura
 */
export interface ICommentWriteRepository {
  /**
   * @method create
   * @description Cria um novo comentário
   */
  create(data: CreateCommentData): Promise<CommentWithRelations>;

  /**
   * @method update
   * @description Atualiza um comentário existente
   */
  update(id: number, data: UpdateCommentData): Promise<CommentWithRelations>;

  /**
   * @method delete
   * @description Remove um comentário
   */
  delete(id: number): Promise<void>;

  /**
   * @method softDelete
   * @description Remove um comentário logicamente (soft delete)
   */
  softDelete(id: number): Promise<void>;

  /**
   * @method restore
   * @description Restaura um comentário removido logicamente
   */
  restore(id: number): Promise<CommentWithRelations>;

  /**
   * @method incrementLikeCount
   * @description Incrementa contador de likes
   */
  incrementLikeCount(id: number): Promise<void>;

  /**
   * @method decrementLikeCount
   * @description Decrementa contador de likes
   */
  decrementLikeCount(id: number): Promise<void>;
}

/**
 * @interface ICommentWriteService
 * @description Interface específica para operações de escrita de comentários
 * 
 * SOLID: ISP - Segregação de operações de escrita no serviço
 * - Interface focada apenas em operações de modificação
 * - Permite implementações com diferentes estratégias de persistência
 */
export interface ICommentWriteService {
  /**
   * @method createComment
   * @description Cria um novo comentário
   */
  createComment(data: CreateCommentDto): Promise<CommentResponseDto>;

  /**
   * @method updateComment
   * @description Atualiza um comentário existente
   */
  updateComment(commentId: number, userId: string, data: UpdateCommentDto): Promise<CommentResponseDto>;

  /**
   * @method deleteComment
   * @description Remove um comentário
   */
  deleteComment(commentId: number, userId: string): Promise<void>;

  /**
   * @method softDeleteComment
   * @description Remove um comentário logicamente
   */
  softDeleteComment(commentId: number, userId: string): Promise<void>;

  /**
   * @method restoreComment
   * @description Restaura um comentário removido logicamente
   */
  restoreComment(commentId: number, userId: string): Promise<CommentResponseDto>;

  /**
   * @method moderateComment
   * @description Modera um comentário (admin only)
   */
  moderateComment(commentId: number, moderatorId: string, action: 'approve' | 'reject' | 'flag'): Promise<void>;
}

/**
 * @interface ICommentBatchWriteService
 * @description Interface específica para operações de escrita em lote
 * 
 * SOLID: ISP - Interface segregada para operações em lote
 * - Permite implementações otimizadas para operações em massa
 * - Clientes que não precisam de operações em lote não dependem desta interface
 */
export interface ICommentBatchWriteService {
  /**
   * @method createMultipleComments
   * @description Cria múltiplos comentários
   */
  createMultipleComments(comments: CreateCommentDto[]): Promise<CommentResponseDto[]>;

  /**
   * @method deleteMultipleComments
   * @description Remove múltiplos comentários
   */
  deleteMultipleComments(commentIds: number[], userId: string): Promise<void>;

  /**
   * @method bulkModerate
   * @description Modera múltiplos comentários
   */
  bulkModerate(commentIds: number[], moderatorId: string, action: 'approve' | 'reject' | 'flag'): Promise<void>;

  /**
   * @method migrateComments
   * @description Migra comentários entre aulas/cursos
   */
  migrateComments(fromId: number, toId: number, type: 'lesson' | 'course'): Promise<void>;
}