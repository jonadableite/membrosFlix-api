/**
 * @fileoverview Comment Read Interface
 * @description Interface específica para operações de leitura de comentários
 * 
 * SOLID PRINCIPLE: Interface Segregation Principle (ISP)
 * - Interface focada apenas em operações de leitura
 * - Clientes que precisam apenas ler dados não dependem de operações de escrita
 * - Permite implementações otimizadas para leitura (ex: cache, read replicas)
 */

import type { CommentWithRelations, CommentResponseDto } from "./comment.interface";

/**
 * @interface ICommentReadRepository
 * @description Interface específica para operações de leitura de comentários
 * 
 * SOLID: ISP - Segregação de operações de leitura
 * - Permite implementações otimizadas para consultas
 * - Clientes read-only não dependem de métodos de escrita
 */
export interface ICommentReadRepository {
  /**
   * @method findById
   * @description Busca comentário por ID
   */
  findById(id: number): Promise<CommentWithRelations | null>;

  /**
   * @method findByLessonId
   * @description Busca comentários por ID da aula
   */
  findByLessonId(lessonId: number): Promise<CommentWithRelations[]>;

  /**
   * @method findByCourseId
   * @description Busca comentários por ID do curso
   */
  findByCourseId(courseId: number): Promise<CommentWithRelations[]>;

  /**
   * @method findReplies
   * @description Busca respostas de um comentário
   */
  findReplies(parentId: number): Promise<CommentWithRelations[]>;

  /**
   * @method countByLessonId
   * @description Conta comentários por ID da aula
   */
  countByLessonId(lessonId: number): Promise<number>;

  /**
   * @method countByCourseId
   * @description Conta comentários por ID do curso
   */
  countByCourseId(courseId: number): Promise<number>;

  /**
   * @method findByUserId
   * @description Busca comentários por ID do usuário
   */
  findByUserId(userId: string): Promise<CommentWithRelations[]>;
}

/**
 * @interface ICommentReadService
 * @description Interface específica para operações de leitura de comentários
 * 
 * SOLID: ISP - Segregação de operações de leitura no serviço
 * - Interface focada apenas em consultas
 * - Permite implementações otimizadas para leitura
 */
export interface ICommentReadService {
  /**
   * @method getCommentById
   * @description Obtém comentário por ID
   */
  getCommentById(id: number, userId?: string): Promise<CommentResponseDto | null>;

  /**
   * @method getCommentsByLesson
   * @description Obtém comentários por aula
   */
  getCommentsByLesson(lessonId: number, userId?: string): Promise<CommentResponseDto[]>;

  /**
   * @method getCommentsByCourse
   * @description Obtém comentários por curso
   */
  getCommentsByCourse(courseId: number, userId?: string): Promise<CommentResponseDto[]>;

  /**
   * @method getReplies
   * @description Obtém respostas de um comentário
   */
  getReplies(parentId: number, userId?: string): Promise<CommentResponseDto[]>;

  /**
   * @method getCommentStats
   * @description Obtém estatísticas de comentários
   */
  getCommentStats(lessonId?: number, courseId?: number): Promise<{
    totalComments: number;
    totalReplies: number;
    averageCommentsPerLesson?: number;
  }>;

  /**
   * @method getUserComments
   * @description Obtém comentários de um usuário
   */
  getUserComments(userId: string): Promise<CommentResponseDto[]>;
}