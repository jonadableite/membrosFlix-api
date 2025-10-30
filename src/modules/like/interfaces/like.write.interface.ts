/**
 * @fileoverview Like Write Interface
 * @description Interface específica para operações de escrita de likes
 * 
 * SOLID PRINCIPLE: Interface Segregation Principle (ISP)
 * - Interface focada apenas em operações de escrita
 * - Clientes que precisam apenas escrever dados não dependem de operações de leitura
 * - Permite implementações otimizadas para escrita (ex: write-through cache)
 */

import type { CreateLikeDto, LikeResponseDto } from './like.interface.js';

/**
 * @interface ILikeWriteRepository
 * @description Interface específica para operações de escrita de likes
 * 
 * SOLID: ISP - Segregação de operações de escrita
 * - Permite implementações otimizadas para persistência
 * - Clientes write-only não dependem de métodos de leitura
 */
export interface ILikeWriteRepository {
  /**
   * @method create
   * @description Cria um novo like
   */
  create(data: CreateLikeDto): Promise<LikeResponseDto>;

  /**
   * @method delete
   * @description Remove um like
   */
  delete(id: number): Promise<void>;

  /**
   * @method deleteByUserAndComment
   * @description Remove like por usuário e comentário
   */
  deleteByUserAndComment(userId: string, commentId: number): Promise<void>;

  /**
   * @method deleteByUserAndLesson
   * @description Remove like por usuário e aula
   */
  deleteByUserAndLesson(userId: string, aulaId: number): Promise<void>;

  /**
   * @method updateTimestamp
   * @description Atualiza timestamp do like (para reordenação)
   */
  updateTimestamp(id: number): Promise<LikeResponseDto>;
}

/**
 * @interface ILikeWriteService
 * @description Interface específica para operações de escrita de likes
 * 
 * SOLID: ISP - Segregação de operações de escrita no serviço
 * - Interface focada apenas em operações de modificação
 * - Permite implementações com diferentes estratégias de persistência
 */
export interface ILikeWriteService {
  /**
   * @method createLike
   * @description Cria um novo like
   */
  createLike(data: CreateLikeDto): Promise<LikeResponseDto>;

  /**
   * @method removeLike
   * @description Remove um like
   */
  removeLike(id: number, userId: string): Promise<void>;

  /**
   * @method toggleCommentLike
   * @description Alterna like em comentário (like/unlike)
   */
  toggleCommentLike(userId: string, commentId: number): Promise<{
    action: 'liked' | 'unliked';
    like?: LikeResponseDto;
  }>;

  /**
   * @method toggleLessonLike
   * @description Alterna like em aula (like/unlike)
   */
  toggleLessonLike(userId: string, aulaId: number): Promise<{
    action: 'liked' | 'unliked';
    like?: LikeResponseDto;
  }>;
}

/**
 * @interface ILikeBatchWriteService
 * @description Interface específica para operações de escrita em lote
 * 
 * SOLID: ISP - Interface segregada para operações em lote
 * - Permite implementações otimizadas para operações em massa
 * - Clientes que não precisam de operações em lote não dependem desta interface
 */
export interface ILikeBatchWriteService {
  /**
   * @method createMultipleLikes
   * @description Cria múltiplos likes
   */
  createMultipleLikes(likes: CreateLikeDto[]): Promise<LikeResponseDto[]>;

  /**
   * @method deleteMultipleLikes
   * @description Remove múltiplos likes
   */
  deleteMultipleLikes(likeIds: number[], userId: string): Promise<void>;

  /**
   * @method deleteUserLikes
   * @description Remove todos os likes de um usuário
   */
  deleteUserLikes(userId: string): Promise<void>;

  /**
   * @method deleteCommentLikes
   * @description Remove todos os likes de um comentário
   */
  deleteCommentLikes(commentId: number): Promise<void>;

  /**
   * @method deleteLessonLikes
   * @description Remove todos os likes de uma aula
   */
  deleteLessonLikes(aulaId: number): Promise<void>;

  /**
   * @method migrateLikes
   * @description Migra likes entre comentários/aulas
   */
  migrateLikes(fromId: number, toId: number, type: 'comment' | 'lesson'): Promise<void>;
}

/**
 * @interface ILikeNotificationService
 * @description Interface específica para notificações de likes
 * 
 * SOLID: ISP - Interface segregada para notificações
 * - Permite implementações especializadas em notificações
 * - Clientes que não precisam de notificações não dependem desta interface
 */
export interface ILikeNotificationService {
  /**
   * @method notifyLikeCreated
   * @description Notifica sobre novo like
   */
  notifyLikeCreated(like: LikeResponseDto): Promise<void>;

  /**
   * @method notifyLikeRemoved
   * @description Notifica sobre like removido
   */
  notifyLikeRemoved(userId: string, targetId: number, type: 'comment' | 'lesson'): Promise<void>;

  /**
   * @method notifyMilestone
   * @description Notifica sobre marcos de likes (ex: 100 likes)
   */
  notifyMilestone(targetId: number, type: 'comment' | 'lesson', milestone: number): Promise<void>;

  /**
   * @method sendDigestNotification
   * @description Envia notificação resumo de likes
   */
  sendDigestNotification(userId: string, period: 'daily' | 'weekly'): Promise<void>;
}