/**
 * @fileoverview Like Read Interface
 * @description Interface específica para operações de leitura de likes
 * 
 * SOLID PRINCIPLE: Interface Segregation Principle (ISP)
 * - Interface focada apenas em operações de leitura
 * - Clientes que precisam apenas ler dados não dependem de operações de escrita
 * - Permite implementações otimizadas para leitura (ex: cache, read replicas)
 */

import type { LikeResponseDto, LikeStatsDto } from './like.interface.js';

/**
 * @interface ILikeReadRepository
 * @description Interface específica para operações de leitura de likes
 * 
 * SOLID: ISP - Segregação de operações de leitura
 * - Permite implementações otimizadas para consultas
 * - Clientes read-only não dependem de métodos de escrita
 */
export interface ILikeReadRepository {
  /**
   * @method findById
   * @description Busca like por ID
   */
  findById(id: number): Promise<LikeResponseDto | null>;

  /**
   * @method findByUserAndComment
   * @description Busca like por usuário e comentário
   */
  findByUserAndComment(userId: string, commentId: number): Promise<LikeResponseDto | null>;

  /**
   * @method findByUserAndLesson
   * @description Busca like por usuário e aula
   */
  findByUserAndLesson(userId: string, aulaId: number): Promise<LikeResponseDto | null>;

  /**
   * @method findByComment
   * @description Busca todos os likes de um comentário
   */
  findByComment(commentId: number): Promise<LikeResponseDto[]>;

  /**
   * @method findByLesson
   * @description Busca todos os likes de uma aula
   */
  findByLesson(aulaId: number): Promise<LikeResponseDto[]>;

  /**
   * @method findByUser
   * @description Busca todos os likes de um usuário
   */
  findByUser(userId: string): Promise<LikeResponseDto[]>;

  /**
   * @method countByComment
   * @description Conta likes de um comentário
   */
  countByComment(commentId: number): Promise<number>;

  /**
   * @method countByLesson
   * @description Conta likes de uma aula
   */
  countByLesson(aulaId: number): Promise<number>;

  /**
   * @method countByUser
   * @description Conta likes de um usuário
   */
  countByUser(userId: string): Promise<number>;
}

/**
 * @interface ILikeReadService
 * @description Interface específica para operações de leitura de likes
 * 
 * SOLID: ISP - Segregação de operações de leitura no serviço
 * - Interface focada apenas em consultas
 * - Permite implementações otimizadas para leitura
 */
export interface ILikeReadService {
  /**
   * @method getLikeById
   * @description Obtém like por ID
   */
  getLikeById(id: number): Promise<LikeResponseDto | null>;

  /**
   * @method getUserLikeForComment
   * @description Verifica se usuário curtiu um comentário
   */
  getUserLikeForComment(userId: string, commentId: number): Promise<LikeResponseDto | null>;

  /**
   * @method getUserLikeForLesson
   * @description Verifica se usuário curtiu uma aula
   */
  getUserLikeForLesson(userId: string, aulaId: number): Promise<LikeResponseDto | null>;

  /**
   * @method getCommentLikes
   * @description Obtém todos os likes de um comentário
   */
  getCommentLikes(commentId: number): Promise<LikeResponseDto[]>;

  /**
   * @method getLessonLikes
   * @description Obtém todos os likes de uma aula
   */
  getLessonLikes(aulaId: number): Promise<LikeResponseDto[]>;

  /**
   * @method getUserLikes
   * @description Obtém todos os likes de um usuário
   */
  getUserLikes(userId: string): Promise<LikeResponseDto[]>;

  /**
   * @method getCommentStats
   * @description Obtém estatísticas de likes de um comentário
   */
  getCommentStats(commentId: number, userId?: string): Promise<LikeStatsDto>;

  /**
   * @method getLessonStats
   * @description Obtém estatísticas de likes de uma aula
   */
  getLessonStats(aulaId: number, userId?: string): Promise<LikeStatsDto>;

  /**
   * @method getUserStats
   * @description Obtém estatísticas de likes de um usuário
   */
  getUserStats(userId: string): Promise<{
    totalLikesGiven: number;
    totalLikesReceived: number;
    mostLikedComment?: number;
    mostLikedLesson?: number;
  }>;
}

/**
 * @interface ILikeAnalyticsService
 * @description Interface específica para análises de likes
 * 
 * SOLID: ISP - Interface segregada para analytics
 * - Permite implementações especializadas em análise de dados
 * - Clientes que não precisam de analytics não dependem desta interface
 */
export interface ILikeAnalyticsService {
  /**
   * @method getTrendingComments
   * @description Obtém comentários em alta baseado em likes
   */
  getTrendingComments(limit?: number, timeframe?: 'day' | 'week' | 'month'): Promise<{
    commentId: number;
    likesCount: number;
    growthRate: number;
  }[]>;

  /**
   * @method getTrendingLessons
   * @description Obtém aulas em alta baseado em likes
   */
  getTrendingLessons(limit?: number, timeframe?: 'day' | 'week' | 'month'): Promise<{
    aulaId: number;
    likesCount: number;
    growthRate: number;
  }[]>;

  /**
   * @method getLikeActivity
   * @description Obtém atividade de likes por período
   */
  getLikeActivity(timeframe: 'day' | 'week' | 'month'): Promise<{
    date: Date;
    likesCount: number;
    uniqueUsers: number;
  }[]>;

  /**
   * @method getTopLikedContent
   * @description Obtém conteúdo mais curtido
   */
  getTopLikedContent(type: 'comment' | 'lesson', limit?: number): Promise<{
    id: number;
    likesCount: number;
    title?: string;
    content?: string;
  }[]>;
}