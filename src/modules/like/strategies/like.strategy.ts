/**
 * @fileoverview Like Strategies
 * @description Implementação de estratégias para diferentes comportamentos de likes
 * 
 * SOLID PRINCIPLES APPLIED:
 * 
 * 1. Open/Closed Principle (OCP):
 *    - Aberto para extensão: novas estratégias podem ser adicionadas
 *    - Fechado para modificação: estratégias existentes não precisam ser alteradas
 *    - Permite diferentes algoritmos de processamento de likes
 * 
 * 2. Strategy Pattern:
 *    - Encapsula algoritmos em classes separadas
 *    - Permite troca dinâmica de comportamentos
 *    - Facilita testes unitários de cada estratégia
 * 
 * 3. Single Responsibility Principle (SRP):
 *    - Cada estratégia tem uma responsabilidade específica
 *    - Separação clara entre diferentes tipos de processamento
 */

import { Like } from "@prisma/client";
import { CreateLikeDto, LikeResponseDto, LikeStatsDto } from "../interfaces/like.interface";

// ============================================================================
// INTERFACES PARA ESTRATÉGIAS (OCP + ISP)
// ============================================================================

/**
 * @interface ILikeProcessingStrategy
 * @description Interface base para estratégias de processamento de likes
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Define contrato para novas estratégias
 * - Permite extensão sem modificação
 */
export interface ILikeProcessingStrategy {
  /**
   * Processa um like antes da criação
   * @param {CreateLikeDto} likeData - Dados do like
   * @returns {Promise<CreateLikeDto>} Dados processados
   */
  processBeforeCreate(likeData: CreateLikeDto): Promise<CreateLikeDto>;

  /**
   * Processa um like após a criação
   * @param {Like} like - Like criado
   * @returns {Promise<Like>} Like processado
   */
  processAfterCreate(like: Like): Promise<Like>;

  /**
   * Processa um like antes da remoção
   * @param {Like} like - Like a ser removido
   * @returns {Promise<Like>} Like processado
   */
  processBeforeRemove(like: Like): Promise<Like>;

  /**
   * Processa após remoção do like
   * @param {string} userId - ID do usuário
   * @param {number} aulaId - ID da aula (opcional)
   * @param {number} commentId - ID do comentário (opcional)
   * @returns {Promise<void>}
   */
  processAfterRemove(userId: string, aulaId?: number, commentId?: number): Promise<void>;
}

/**
 * @interface ILikeAnalyticsStrategy
 * @description Interface para estratégias de analytics de likes
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface específica para analytics
 * - Separada da lógica de processamento
 */
export interface ILikeAnalyticsStrategy {
  /**
   * Registra evento de like para analytics
   * @param {Like} like - Like criado
   * @returns {Promise<void>}
   */
  trackLikeEvent(like: Like): Promise<void>;

  /**
   * Registra evento de unlike para analytics
   * @param {string} userId - ID do usuário
   * @param {number} aulaId - ID da aula (opcional)
   * @param {number} commentId - ID do comentário (opcional)
   * @returns {Promise<void>}
   */
  trackUnlikeEvent(userId: string, aulaId?: number, commentId?: number): Promise<void>;

  /**
   * Gera estatísticas de likes
   * @param {number} aulaId - ID da aula (opcional)
   * @param {number} commentId - ID do comentário (opcional)
   * @returns {Promise<LikeStatsDto>} Estatísticas
   */
  generateStats(aulaId?: number, commentId?: number): Promise<LikeStatsDto>;
}

/**
 * @interface ILikeRateLimitStrategy
 * @description Interface para estratégias de rate limiting
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface específica para rate limiting
 * - Permite diferentes algoritmos de limitação
 */
export interface ILikeRateLimitStrategy {
  /**
   * Verifica se o usuário pode dar like
   * @param {string} userId - ID do usuário
   * @returns {Promise<boolean>} True se pode dar like
   */
  canLike(userId: string): Promise<boolean>;

  /**
   * Registra tentativa de like
   * @param {string} userId - ID do usuário
   * @returns {Promise<void>}
   */
  recordLikeAttempt(userId: string): Promise<void>;

  /**
   * Obtém informações sobre limite do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<{remaining: number; resetTime: Date}>}
   */
  getLimitInfo(userId: string): Promise<{remaining: number; resetTime: Date}>;
}

/**
 * @interface ILikeNotificationStrategy
 * @description Interface para estratégias de notificação
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface específica para notificações
 * - Permite diferentes tipos de notificação
 */
export interface ILikeNotificationStrategy {
  /**
   * Envia notificação sobre novo like
   * @param {Like} like - Like criado
   * @returns {Promise<void>}
   */
  notifyNewLike(like: Like): Promise<void>;

  /**
   * Envia notificação sobre milestone de likes
   * @param {number} aulaId - ID da aula (opcional)
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} likeCount - Número de likes
   * @returns {Promise<void>}
   */
  notifyLikeMilestone(aulaId: number | undefined, commentId: number | undefined, likeCount: number): Promise<void>;
}

// ============================================================================
// ESTRATÉGIAS DE PROCESSAMENTO (OCP)
// ============================================================================

/**
 * @class DefaultLikeProcessingStrategy
 * @description Estratégia padrão de processamento de likes
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Implementação base que pode ser estendida
 * - Não precisa ser modificada para adicionar novos comportamentos
 */
export class DefaultLikeProcessingStrategy implements ILikeProcessingStrategy {
  /**
   * Processa like antes da criação - implementação padrão
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: processamento básico
   */
  async processBeforeCreate(likeData: CreateLikeDto): Promise<CreateLikeDto> {
    // Processamento básico: validação de dados
    return {
      ...likeData,
      createdAt: new Date(),
    };
  }

  /**
   * Processa like após criação - implementação padrão
   */
  async processAfterCreate(like: Like): Promise<Like> {
    // Implementação padrão: retorna sem modificações
    return like;
  }

  /**
   * Processa like antes da remoção - implementação padrão
   */
  async processBeforeRemove(like: Like): Promise<Like> {
    // Implementação padrão: retorna sem modificações
    return like;
  }

  /**
   * Processa após remoção - implementação padrão
   */
  async processAfterRemove(userId: string, aulaId?: number, commentId?: number): Promise<void> {
    // Implementação padrão: não faz nada
  }
}

/**
 * @class AnalyticsLikeProcessingStrategy
 * @description Estratégia com analytics integrado
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Extensão da funcionalidade sem modificar código existente
 * - Adiciona comportamento de analytics
 */
export class AnalyticsLikeProcessingStrategy implements ILikeProcessingStrategy {
  private analyticsStrategy: ILikeAnalyticsStrategy;

  constructor(analyticsStrategy: ILikeAnalyticsStrategy) {
    this.analyticsStrategy = analyticsStrategy;
  }

  async processBeforeCreate(likeData: CreateLikeDto): Promise<CreateLikeDto> {
    // Processamento básico
    const baseStrategy = new DefaultLikeProcessingStrategy();
    return baseStrategy.processBeforeCreate(likeData);
  }

  /**
   * Processa com analytics após criação
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Adiciona funcionalidade sem modificar estratégia base
   */
  async processAfterCreate(like: Like): Promise<Like> {
    // Registra evento de analytics
    await this.analyticsStrategy.trackLikeEvent(like);
    
    return like;
  }

  async processBeforeRemove(like: Like): Promise<Like> {
    return like;
  }

  async processAfterRemove(userId: string, aulaId?: number, commentId?: number): Promise<void> {
    // Registra evento de unlike
    await this.analyticsStrategy.trackUnlikeEvent(userId, aulaId, commentId);
  }
}

/**
 * @class RateLimitedLikeProcessingStrategy
 * @description Estratégia com rate limiting
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Nova funcionalidade sem modificar código existente
 * - Adiciona controle de rate limiting
 */
export class RateLimitedLikeProcessingStrategy implements ILikeProcessingStrategy {
  private rateLimitStrategy: ILikeRateLimitStrategy;
  private baseStrategy: ILikeProcessingStrategy;

  constructor(
    rateLimitStrategy: ILikeRateLimitStrategy,
    baseStrategy: ILikeProcessingStrategy = new DefaultLikeProcessingStrategy()
  ) {
    this.rateLimitStrategy = rateLimitStrategy;
    this.baseStrategy = baseStrategy;
  }

  /**
   * Processa com verificação de rate limit
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Adiciona funcionalidade sem modificar estratégia base
   */
  async processBeforeCreate(likeData: CreateLikeDto): Promise<CreateLikeDto> {
    // Verifica rate limit
    const canLike = await this.rateLimitStrategy.canLike(likeData.userId);
    
    if (!canLike) {
      throw new Error('Rate limit exceeded for likes');
    }

    // Registra tentativa
    await this.rateLimitStrategy.recordLikeAttempt(likeData.userId);

    // Processa normalmente
    return this.baseStrategy.processBeforeCreate(likeData);
  }

  async processAfterCreate(like: Like): Promise<Like> {
    return this.baseStrategy.processAfterCreate(like);
  }

  async processBeforeRemove(like: Like): Promise<Like> {
    return this.baseStrategy.processBeforeRemove(like);
  }

  async processAfterRemove(userId: string, aulaId?: number, commentId?: number): Promise<void> {
    return this.baseStrategy.processAfterRemove(userId, aulaId, commentId);
  }
}

// ============================================================================
// ESTRATÉGIAS DE ANALYTICS (OCP)
// ============================================================================

/**
 * @class BasicAnalyticsStrategy
 * @description Estratégia básica de analytics
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Implementação base para analytics
 */
export class BasicAnalyticsStrategy implements ILikeAnalyticsStrategy {
  async trackLikeEvent(like: Like): Promise<void> {
    console.log(`Analytics: Like criado - User: ${like.userId}, Aula: ${like.aulaId}, Comment: ${like.commentId}`);
    
    // Aqui seria a integração com serviço de analytics
    // await analyticsService.track('like_created', {
    //   userId: like.userId,
    //   aulaId: like.aulaId,
    //   commentId: like.commentId,
    //   timestamp: like.createdAt
    // });
  }

  async trackUnlikeEvent(userId: string, aulaId?: number, commentId?: number): Promise<void> {
    console.log(`Analytics: Unlike - User: ${userId}, Aula: ${aulaId}, Comment: ${commentId}`);
    
    // Implementação de tracking de unlike
  }

  async generateStats(aulaId?: number, commentId?: number): Promise<LikeStatsDto> {
    // Implementação básica de estatísticas
    return {
      totalLikes: 0,
      likesThisWeek: 0,
      likesThisMonth: 0,
      averageLikesPerDay: 0,
      topLikedContent: [],
    };
  }
}

/**
 * @class DetailedAnalyticsStrategy
 * @description Estratégia detalhada de analytics
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Extensão com analytics mais detalhado
 */
export class DetailedAnalyticsStrategy implements ILikeAnalyticsStrategy {
  async trackLikeEvent(like: Like): Promise<void> {
    // Analytics básico
    const basicStrategy = new BasicAnalyticsStrategy();
    await basicStrategy.trackLikeEvent(like);

    // Analytics detalhado adicional
    console.log(`Detailed Analytics: Processando métricas avançadas para like ${like.id}`);
    
    // Aqui seria análise mais profunda:
    // - Padrões de comportamento do usuário
    // - Correlações entre likes e engajamento
    // - Análise temporal de likes
    // - Segmentação de usuários
  }

  async trackUnlikeEvent(userId: string, aulaId?: number, commentId?: number): Promise<void> {
    const basicStrategy = new BasicAnalyticsStrategy();
    await basicStrategy.trackUnlikeEvent(userId, aulaId, commentId);

    // Analytics detalhado para unlike
    console.log(`Detailed Analytics: Analisando padrão de unlike para user ${userId}`);
  }

  async generateStats(aulaId?: number, commentId?: number): Promise<LikeStatsDto> {
    // Gera estatísticas mais detalhadas
    return {
      totalLikes: 0,
      likesThisWeek: 0,
      likesThisMonth: 0,
      averageLikesPerDay: 0,
      topLikedContent: [],
      // Métricas adicionais que poderiam ser incluídas:
      // likeGrowthRate: 0.15,
      // peakLikeHours: [14, 15, 20, 21],
      // userRetentionByLikes: 0.85,
    };
  }
}

// ============================================================================
// ESTRATÉGIAS DE RATE LIMITING (OCP)
// ============================================================================

/**
 * @class HourlyRateLimitStrategy
 * @description Rate limiting por hora
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Implementação específica de rate limiting
 */
export class HourlyRateLimitStrategy implements ILikeRateLimitStrategy {
  private readonly maxLikesPerHour: number;
  private readonly userAttempts: Map<string, Array<Date>> = new Map();

  constructor(maxLikesPerHour: number = 100) {
    this.maxLikesPerHour = maxLikesPerHour;
  }

  async canLike(userId: string): Promise<boolean> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const userAttempts = this.getUserAttempts(userId);
    
    // Remove tentativas antigas
    const recentAttempts = userAttempts.filter(attempt => attempt > oneHourAgo);
    this.userAttempts.set(userId, recentAttempts);
    
    return recentAttempts.length < this.maxLikesPerHour;
  }

  async recordLikeAttempt(userId: string): Promise<void> {
    const userAttempts = this.getUserAttempts(userId);
    userAttempts.push(new Date());
    this.userAttempts.set(userId, userAttempts);
  }

  async getLimitInfo(userId: string): Promise<{remaining: number; resetTime: Date}> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    
    const userAttempts = this.getUserAttempts(userId);
    const recentAttempts = userAttempts.filter(attempt => attempt > oneHourAgo);
    
    return {
      remaining: Math.max(0, this.maxLikesPerHour - recentAttempts.length),
      resetTime: nextHour,
    };
  }

  /**
   * Obtém tentativas do usuário
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Método com responsabilidade específica
   */
  private getUserAttempts(userId: string): Date[] {
    return this.userAttempts.get(userId) || [];
  }
}

/**
 * @class DailyRateLimitStrategy
 * @description Rate limiting por dia
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Nova estratégia sem modificar código existente
 */
export class DailyRateLimitStrategy implements ILikeRateLimitStrategy {
  private readonly maxLikesPerDay: number;
  private readonly userAttempts: Map<string, Array<Date>> = new Map();

  constructor(maxLikesPerDay: number = 500) {
    this.maxLikesPerDay = maxLikesPerDay;
  }

  async canLike(userId: string): Promise<boolean> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const userAttempts = this.getUserAttempts(userId);
    const recentAttempts = userAttempts.filter(attempt => attempt > oneDayAgo);
    
    return recentAttempts.length < this.maxLikesPerDay;
  }

  async recordLikeAttempt(userId: string): Promise<void> {
    const userAttempts = this.getUserAttempts(userId);
    userAttempts.push(new Date());
    this.userAttempts.set(userId, userAttempts);
  }

  async getLimitInfo(userId: string): Promise<{remaining: number; resetTime: Date}> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const userAttempts = this.getUserAttempts(userId);
    const recentAttempts = userAttempts.filter(attempt => attempt > oneDayAgo);
    
    return {
      remaining: Math.max(0, this.maxLikesPerDay - recentAttempts.length),
      resetTime: nextDay,
    };
  }

  private getUserAttempts(userId: string): Date[] {
    return this.userAttempts.get(userId) || [];
  }
}

// ============================================================================
// ESTRATÉGIAS DE NOTIFICAÇÃO (OCP)
// ============================================================================

/**
 * @class MilestoneNotificationStrategy
 * @description Notificações baseadas em milestones
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Estratégia específica para milestones
 */
export class MilestoneNotificationStrategy implements ILikeNotificationStrategy {
  private readonly milestones: number[] = [10, 25, 50, 100, 250, 500, 1000];

  async notifyNewLike(like: Like): Promise<void> {
    // Notificação básica não implementada nesta estratégia
    // Foca apenas em milestones
  }

  async notifyLikeMilestone(
    aulaId: number | undefined, 
    commentId: number | undefined, 
    likeCount: number
  ): Promise<void> {
    if (this.milestones.includes(likeCount)) {
      console.log(`🎉 Milestone alcançado: ${likeCount} likes!`);
      
      // Aqui seria a implementação de notificação
      // await notificationService.send({
      //   type: 'milestone',
      //   data: { aulaId, commentId, likeCount },
      //   message: `Parabéns! Seu conteúdo alcançou ${likeCount} likes!`
      // });
    }
  }
}

/**
 * @class RealTimeNotificationStrategy
 * @description Notificações em tempo real
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Nova estratégia sem modificar código existente
 */
export class RealTimeNotificationStrategy implements ILikeNotificationStrategy {
  async notifyNewLike(like: Like): Promise<void> {
    console.log(`🔔 Novo like em tempo real: ${like.id}`);
    
    // Implementação de notificação em tempo real
    // await websocketService.emit('new-like', {
    //   likeId: like.id,
    //   userId: like.userId,
    //   aulaId: like.aulaId,
    //   commentId: like.commentId,
    //   timestamp: like.createdAt
    // });
  }

  async notifyLikeMilestone(
    aulaId: number | undefined, 
    commentId: number | undefined, 
    likeCount: number
  ): Promise<void> {
    // Esta estratégia não lida com milestones
    // Foca apenas em notificações em tempo real
  }
}

// ============================================================================
// COMPOSITE STRATEGY (OCP + Composite Pattern)
// ============================================================================

/**
 * @class CompositeLikeProcessingStrategy
 * @description Combina múltiplas estratégias de processamento
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Permite combinação de estratégias sem modificar código
 * - Composite Pattern para múltiplos processamentos
 */
export class CompositeLikeProcessingStrategy implements ILikeProcessingStrategy {
  private strategies: ILikeProcessingStrategy[] = [];

  constructor(strategies: ILikeProcessingStrategy[]) {
    this.strategies = strategies;
  }

  /**
   * Adiciona nova estratégia
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Permite extensão dinâmica
   */
  addStrategy(strategy: ILikeProcessingStrategy): void {
    this.strategies.push(strategy);
  }

  async processBeforeCreate(likeData: CreateLikeDto): Promise<CreateLikeDto> {
    let processedData = likeData;
    
    // Executa todas as estratégias em sequência
    for (const strategy of this.strategies) {
      processedData = await strategy.processBeforeCreate(processedData);
    }
    
    return processedData;
  }

  async processAfterCreate(like: Like): Promise<Like> {
    let processedLike = like;
    
    for (const strategy of this.strategies) {
      processedLike = await strategy.processAfterCreate(processedLike);
    }
    
    return processedLike;
  }

  async processBeforeRemove(like: Like): Promise<Like> {
    let processedLike = like;
    
    for (const strategy of this.strategies) {
      processedLike = await strategy.processBeforeRemove(processedLike);
    }
    
    return processedLike;
  }

  async processAfterRemove(userId: string, aulaId?: number, commentId?: number): Promise<void> {
    // Executa todas as estratégias em paralelo para after remove
    await Promise.all(
      this.strategies.map(strategy => strategy.processAfterRemove(userId, aulaId, commentId))
    );
  }
}

// ============================================================================
// FACTORY PARA ESTRATÉGIAS (OCP)
// ============================================================================

/**
 * @class LikeStrategyFactory
 * @description Factory para criação de estratégias
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Centraliza criação de estratégias
 * - Facilita adição de novas estratégias
 */
export class LikeStrategyFactory {
  /**
   * Cria estratégia de processamento baseada no tipo
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Permite adição de novos tipos sem modificar código
   */
  static createProcessingStrategy(
    type: 'default' | 'analytics' | 'ratelimited' | 'composite',
    options?: {
      analyticsStrategy?: ILikeAnalyticsStrategy;
      rateLimitStrategy?: ILikeRateLimitStrategy;
      strategies?: ILikeProcessingStrategy[];
    }
  ): ILikeProcessingStrategy {
    switch (type) {
      case 'analytics':
        const analyticsStrategy = options?.analyticsStrategy || new BasicAnalyticsStrategy();
        return new AnalyticsLikeProcessingStrategy(analyticsStrategy);
        
      case 'ratelimited':
        const rateLimitStrategy = options?.rateLimitStrategy || new HourlyRateLimitStrategy();
        return new RateLimitedLikeProcessingStrategy(rateLimitStrategy);
        
      case 'composite':
        const strategies = options?.strategies || [new DefaultLikeProcessingStrategy()];
        return new CompositeLikeProcessingStrategy(strategies);
        
      case 'default':
      default:
        return new DefaultLikeProcessingStrategy();
    }
  }

  /**
   * Cria estratégia de analytics baseada no tipo
   */
  static createAnalyticsStrategy(type: 'basic' | 'detailed'): ILikeAnalyticsStrategy {
    switch (type) {
      case 'detailed':
        return new DetailedAnalyticsStrategy();
      case 'basic':
      default:
        return new BasicAnalyticsStrategy();
    }
  }

  /**
   * Cria estratégia de rate limiting baseada no tipo
   */
  static createRateLimitStrategy(
    type: 'hourly' | 'daily',
    limit?: number
  ): ILikeRateLimitStrategy {
    switch (type) {
      case 'daily':
        return new DailyRateLimitStrategy(limit);
      case 'hourly':
      default:
        return new HourlyRateLimitStrategy(limit);
    }
  }

  /**
   * Cria estratégia de notificação baseada no tipo
   */
  static createNotificationStrategy(
    types: Array<'milestone' | 'realtime'>
  ): ILikeNotificationStrategy {
    const strategies: ILikeNotificationStrategy[] = [];

    types.forEach(type => {
      switch (type) {
        case 'milestone':
          strategies.push(new MilestoneNotificationStrategy());
          break;
        case 'realtime':
          strategies.push(new RealTimeNotificationStrategy());
          break;
      }
    });

    // Se apenas uma estratégia, retorna diretamente
    // Se múltiplas, seria necessário um CompositeNotificationStrategy
    return strategies[0];
  }

  /**
   * Cria estratégia completa com todas as funcionalidades
   */
  static createFullFeaturedStrategy(config: {
    enableAnalytics?: boolean;
    enableRateLimit?: boolean;
    rateLimitType?: 'hourly' | 'daily';
    rateLimitValue?: number;
    analyticsType?: 'basic' | 'detailed';
  }): ILikeProcessingStrategy {
    const strategies: ILikeProcessingStrategy[] = [];

    // Estratégia base
    strategies.push(new DefaultLikeProcessingStrategy());

    // Adiciona analytics se habilitado
    if (config.enableAnalytics) {
      const analyticsStrategy = this.createAnalyticsStrategy(config.analyticsType || 'basic');
      strategies.push(new AnalyticsLikeProcessingStrategy(analyticsStrategy));
    }

    // Adiciona rate limiting se habilitado
    if (config.enableRateLimit) {
      const rateLimitStrategy = this.createRateLimitStrategy(
        config.rateLimitType || 'hourly',
        config.rateLimitValue
      );
      strategies.push(new RateLimitedLikeProcessingStrategy(rateLimitStrategy));
    }

    // Se apenas uma estratégia, retorna diretamente
    if (strategies.length === 1) {
      return strategies[0];
    }

    // Se múltiplas, usa composite
    return new CompositeLikeProcessingStrategy(strategies);
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * EXEMPLOS DE USO:
 * 
 * // 1. Estratégia básica:
 * const strategy = LikeStrategyFactory.createProcessingStrategy('default');
 * 
 * // 2. Estratégia com analytics:
 * const analyticsStrategy = LikeStrategyFactory.createAnalyticsStrategy('detailed');
 * const strategy = LikeStrategyFactory.createProcessingStrategy('analytics', { analyticsStrategy });
 * 
 * // 3. Estratégia com rate limiting:
 * const rateLimitStrategy = LikeStrategyFactory.createRateLimitStrategy('hourly', 50);
 * const strategy = LikeStrategyFactory.createProcessingStrategy('ratelimited', { rateLimitStrategy });
 * 
 * // 4. Estratégia completa:
 * const strategy = LikeStrategyFactory.createFullFeaturedStrategy({
 *   enableAnalytics: true,
 *   enableRateLimit: true,
 *   rateLimitType: 'hourly',
 *   rateLimitValue: 100,
 *   analyticsType: 'detailed'
 * });
 * 
 * // 5. Composite personalizado:
 * const strategies = [
 *   new DefaultLikeProcessingStrategy(),
 *   new AnalyticsLikeProcessingStrategy(new DetailedAnalyticsStrategy()),
 *   new RateLimitedLikeProcessingStrategy(new HourlyRateLimitStrategy(50))
 * ];
 * const compositeStrategy = new CompositeLikeProcessingStrategy(strategies);
 * 
 * // 6. Uso em service:
 * const likeData = { userId: '123', aulaId: 456 };
 * const processedData = await strategy.processBeforeCreate(likeData);
 * // ... criar like ...
 * await strategy.processAfterCreate(createdLike);
 */