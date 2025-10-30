/**
 * @fileoverview Comment Strategies
 * @description Implementação de estratégias para diferentes comportamentos de comentários
 * 
 * SOLID PRINCIPLES APPLIED:
 * 
 * 1. Open/Closed Principle (OCP):
 *    - Aberto para extensão: novas estratégias podem ser adicionadas
 *    - Fechado para modificação: estratégias existentes não precisam ser alteradas
 *    - Permite diferentes algoritmos de processamento de comentários
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

import { Comment } from "@prisma/client";
import { CreateCommentDto, CommentResponseDto } from '../interfaces/comment.interface.js';

// ============================================================================
// INTERFACES PARA ESTRATÉGIAS (OCP + ISP)
// ============================================================================

/**
 * @interface ICommentProcessingStrategy
 * @description Interface base para estratégias de processamento de comentários
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Define contrato para novas estratégias
 * - Permite extensão sem modificação
 */
export interface ICommentProcessingStrategy {
  /**
   * Processa um comentário antes da criação
   * @param {CreateCommentDto} commentData - Dados do comentário
   * @returns {Promise<CreateCommentDto>} Dados processados
   */
  processBeforeCreate(commentData: CreateCommentDto): Promise<CreateCommentDto>;

  /**
   * Processa um comentário após a criação
   * @param {Comment} comment - Comentário criado
   * @returns {Promise<Comment>} Comentário processado
   */
  processAfterCreate(comment: Comment): Promise<Comment>;

  /**
   * Processa comentários para exibição
   * @param {Comment[]} comments - Lista de comentários
   * @returns {Promise<CommentResponseDto[]>} Comentários formatados
   */
  processForDisplay(comments: Comment[]): Promise<CommentResponseDto[]>;
}

/**
 * @interface ICommentFilterStrategy
 * @description Interface para estratégias de filtragem de comentários
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface específica para filtragem
 * - Separada da lógica de processamento
 */
export interface ICommentFilterStrategy {
  /**
   * Filtra comentários baseado em critérios específicos
   * @param {Comment[]} comments - Lista de comentários
   * @param {any} criteria - Critérios de filtragem
   * @returns {Promise<Comment[]>} Comentários filtrados
   */
  filter(comments: Comment[], criteria: any): Promise<Comment[]>;

  /**
   * Verifica se um comentário deve ser incluído
   * @param {Comment} comment - Comentário a verificar
   * @param {any} criteria - Critérios de filtragem
   * @returns {Promise<boolean>} True se deve ser incluído
   */
  shouldInclude(comment: Comment, criteria: any): Promise<boolean>;
}

/**
 * @interface ICommentNotificationStrategy
 * @description Interface para estratégias de notificação
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface específica para notificações
 * - Permite diferentes tipos de notificação
 */
export interface ICommentNotificationStrategy {
  /**
   * Envia notificação sobre novo comentário
   * @param {Comment} comment - Comentário criado
   * @returns {Promise<void>}
   */
  notifyNewComment(comment: Comment): Promise<void>;

  /**
   * Envia notificação sobre resposta a comentário
   * @param {Comment} reply - Resposta criada
   * @param {Comment} originalComment - Comentário original
   * @returns {Promise<void>}
   */
  notifyCommentReply(reply: Comment, originalComment: Comment): Promise<void>;
}

// ============================================================================
// ESTRATÉGIAS DE PROCESSAMENTO (OCP)
// ============================================================================

/**
 * @class DefaultCommentProcessingStrategy
 * @description Estratégia padrão de processamento de comentários
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Implementação base que pode ser estendida
 * - Não precisa ser modificada para adicionar novos comportamentos
 */
export class DefaultCommentProcessingStrategy implements ICommentProcessingStrategy {
  /**
   * Processa comentário antes da criação - implementação padrão
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: processamento básico
   */
  async processBeforeCreate(commentData: CreateCommentDto): Promise<CreateCommentDto> {
    // Processamento básico: trim e validação de tamanho
    return {
      ...commentData,
      content: commentData.content.trim(),
    };
  }

  /**
   * Processa comentário após criação - implementação padrão
   */
  async processAfterCreate(comment: Comment): Promise<Comment> {
    // Implementação padrão: retorna sem modificações
    return comment;
  }

  /**
   * Processa comentários para exibição - implementação padrão
   */
  async processForDisplay(comments: Comment[]): Promise<CommentResponseDto[]> {
    return comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      aulaId: comment.aulaId ?? null,
      cursoId: comment.cursoId ?? null,
      parentId: comment.parentId ?? null,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: {
        id: comment.userId,
        name: "Usuário",
        email: "user@example.com",
        profilePicture: null,
      }, // Dados básicos - será preenchido por outra camada
      likesCount: 0,
      repliesCount: 0,
    }));
  }
}

/**
 * @class ModerationCommentProcessingStrategy
 * @description Estratégia com moderação automática
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Extensão da funcionalidade sem modificar código existente
 * - Adiciona comportamento de moderação
 */
export class ModerationCommentProcessingStrategy implements ICommentProcessingStrategy {
  private readonly bannedWords: string[] = [
    'spam', 'fake', 'scam', 'hate', 'offensive'
  ];

  private readonly maxLength: number = 1000;

  /**
   * Processa com moderação automática
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Adiciona funcionalidade sem modificar estratégia base
   */
  async processBeforeCreate(commentData: CreateCommentDto): Promise<CreateCommentDto> {
    let content = commentData.content.trim();

    // Verifica palavras banidas
    const containsBannedWords = this.bannedWords.some(word => 
      content.toLowerCase().includes(word.toLowerCase())
    );

    if (containsBannedWords) {
      content = this.censorContent(content);
    }

    // Verifica tamanho máximo
    if (content.length > this.maxLength) {
      content = content.substring(0, this.maxLength) + '...';
    }

    return {
      ...commentData,
      content,
    };
  }

  async processAfterCreate(comment: Comment): Promise<Comment> {
    // Marca para revisão se contém palavras suspeitas
    const needsReview = this.bannedWords.some(word => 
      comment.content.toLowerCase().includes(word.toLowerCase())
    );

    if (needsReview) {
      // Aqui poderia marcar o comentário para revisão manual
      console.log(`Comentário ${comment.id} marcado para revisão`);
    }

    return comment;
  }

  async processForDisplay(comments: Comment[]): Promise<CommentResponseDto[]> {
    const baseStrategy = new DefaultCommentProcessingStrategy();
    const processedComments = await baseStrategy.processForDisplay(comments);

    // Adiciona informações de moderação
    return processedComments.map(comment => ({
      ...comment,
      isModerationApproved: true, // Simplificado para exemplo
    }));
  }

  /**
   * Censura conteúdo com palavras banidas
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Método com responsabilidade específica
   */
  private censorContent(content: string): string {
    let censoredContent = content;
    
    this.bannedWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      censoredContent = censoredContent.replace(regex, '*'.repeat(word.length));
    });

    return censoredContent;
  }
}

/**
 * @class RichTextCommentProcessingStrategy
 * @description Estratégia para processamento de comentários com rich text
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Nova funcionalidade sem modificar código existente
 * - Suporte a markdown e formatação
 */
export class RichTextCommentProcessingStrategy implements ICommentProcessingStrategy {
  async processBeforeCreate(commentData: CreateCommentDto): Promise<CreateCommentDto> {
    // Processa markdown básico
    let content = commentData.content.trim();
    
    // Converte markdown básico para HTML
    content = this.processMarkdown(content);
    
    // Sanitiza HTML para segurança
    content = this.sanitizeHtml(content);

    return {
      ...commentData,
      content,
    };
  }

  async processAfterCreate(comment: Comment): Promise<Comment> {
    return comment;
  }

  async processForDisplay(comments: Comment[]): Promise<CommentResponseDto[]> {
    const baseStrategy = new DefaultCommentProcessingStrategy();
    const processedComments = await baseStrategy.processForDisplay(comments);

    // Adiciona suporte a rich text na exibição
    return processedComments.map(comment => ({
      ...comment,
      content: this.renderRichText(comment.content),
      hasRichText: true,
    }));
  }

  /**
   * Processa markdown básico
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: conversão markdown
   */
  private processMarkdown(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
      .replace(/`(.*?)`/g, '<code>$1</code>') // `code`
      .replace(/\n/g, '<br>'); // quebras de linha
  }

  /**
   * Sanitiza HTML para segurança
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: sanitização
   */
  private sanitizeHtml(content: string): string {
    // Implementação básica - em produção usar biblioteca como DOMPurify
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '');
  }

  /**
   * Renderiza rich text para exibição
   */
  private renderRichText(content: string): string {
    // Aqui poderia haver lógica adicional de renderização
    return content;
  }
}

// ============================================================================
// ESTRATÉGIAS DE FILTRAGEM (OCP)
// ============================================================================

/**
 * @class VisibilityFilterStrategy
 * @description Filtra comentários por visibilidade
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Estratégia específica que pode ser combinada com outras
 */
export class VisibilityFilterStrategy implements ICommentFilterStrategy {
  async filter(comments: Comment[], criteria: { showHidden?: boolean }): Promise<Comment[]> {
    if (criteria.showHidden) {
      return comments;
    }

    // Como não temos isVisible, retornamos todos os comentários por padrão
    return comments;
  }

  async shouldInclude(_comment: Comment, _criteria: { showHidden?: boolean }): Promise<boolean> {
    // Como não temos isVisible, incluímos todos os comentários por padrão
    return true;
  }
}

/**
 * @class DateRangeFilterStrategy
 * @description Filtra comentários por intervalo de datas
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Nova estratégia sem modificar código existente
 */
export class DateRangeFilterStrategy implements ICommentFilterStrategy {
  async filter(
    comments: Comment[], 
    criteria: { startDate?: Date; endDate?: Date }
  ): Promise<Comment[]> {
    return comments.filter(comment => {
      const commentDate = new Date(comment.createdAt);
      
      if (criteria.startDate && commentDate < criteria.startDate) {
        return false;
      }
      
      if (criteria.endDate && commentDate > criteria.endDate) {
        return false;
      }
      
      return true;
    });
  }

  async shouldInclude(
    comment: Comment, 
    criteria: { startDate?: Date; endDate?: Date }
  ): Promise<boolean> {
    const commentDate = new Date(comment.createdAt);
    
    if (criteria.startDate && commentDate < criteria.startDate) {
      return false;
    }
    
    if (criteria.endDate && commentDate > criteria.endDate) {
      return false;
    }
    
    return true;
  }
}

// ============================================================================
// ESTRATÉGIAS DE NOTIFICAÇÃO (OCP)
// ============================================================================

/**
 * @class EmailNotificationStrategy
 * @description Estratégia de notificação por email
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Implementação específica de notificação
 * - Pode ser combinada com outras estratégias
 */
export class EmailNotificationStrategy implements ICommentNotificationStrategy {
  async notifyNewComment(comment: Comment): Promise<void> {
    // Implementação de envio de email
    console.log(`Enviando email sobre novo comentário: ${comment.id}`);
    
    // Aqui seria a integração com serviço de email
    // await emailService.send({
    //   to: getUserEmail(comment.userId),
    //   subject: 'Novo comentário na aula',
    //   template: 'new-comment',
    //   data: { comment }
    // });
  }

  async notifyCommentReply(_reply: Comment, originalComment: Comment): Promise<void> {
    console.log(`Enviando email sobre resposta ao comentário: ${originalComment.id}`);
    
    // Implementação de notificação de resposta
  }
}

/**
 * @class PushNotificationStrategy
 * @description Estratégia de notificação push
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Nova estratégia sem modificar código existente
 */
export class PushNotificationStrategy implements ICommentNotificationStrategy {
  async notifyNewComment(comment: Comment): Promise<void> {
    console.log(`Enviando push notification sobre comentário: ${comment.id}`);
    
    // Implementação de push notification
  }

  async notifyCommentReply(reply: Comment, _originalComment: Comment): Promise<void> {
    console.log(`Enviando push sobre resposta: ${reply.id}`);
    
    // Implementação de notificação push para resposta
  }
}

// ============================================================================
// COMPOSITE STRATEGY (OCP + Composite Pattern)
// ============================================================================

/**
 * @class CompositeNotificationStrategy
 * @description Combina múltiplas estratégias de notificação
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Permite combinação de estratégias sem modificar código
 * - Composite Pattern para múltiplas notificações
 */
export class CompositeNotificationStrategy implements ICommentNotificationStrategy {
  private strategies: ICommentNotificationStrategy[] = [];

  constructor(strategies: ICommentNotificationStrategy[]) {
    this.strategies = strategies;
  }

  /**
   * Adiciona nova estratégia
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Permite extensão dinâmica
   */
  addStrategy(strategy: ICommentNotificationStrategy): void {
    this.strategies.push(strategy);
  }

  async notifyNewComment(comment: Comment): Promise<void> {
    // Executa todas as estratégias em paralelo
    await Promise.all(
      this.strategies.map(strategy => strategy.notifyNewComment(comment))
    );
  }

  async notifyCommentReply(reply: Comment, originalComment: Comment): Promise<void> {
    await Promise.all(
      this.strategies.map(strategy => strategy.notifyCommentReply(reply, originalComment))
    );
  }
}

// ============================================================================
// FACTORY PARA ESTRATÉGIAS (OCP)
// ============================================================================

/**
 * @class CommentStrategyFactory
 * @description Factory para criação de estratégias
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Centraliza criação de estratégias
 * - Facilita adição de novas estratégias
 */
export class CommentStrategyFactory {
  /**
   * Cria estratégia de processamento baseada no tipo
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Permite adição de novos tipos sem modificar código
   */
  static createProcessingStrategy(type: 'default' | 'moderation' | 'richtext'): ICommentProcessingStrategy {
    switch (type) {
      case 'moderation':
        return new ModerationCommentProcessingStrategy();
      case 'richtext':
        return new RichTextCommentProcessingStrategy();
      case 'default':
      default:
        return new DefaultCommentProcessingStrategy();
    }
  }

  /**
   * Cria estratégia de filtragem baseada no tipo
   */
  static createFilterStrategy(type: 'visibility' | 'daterange'): ICommentFilterStrategy {
    switch (type) {
      case 'daterange':
        return new DateRangeFilterStrategy();
      case 'visibility':
      default:
        return new VisibilityFilterStrategy();
    }
  }

  /**
   * Cria estratégia de notificação baseada no tipo
   */
  static createNotificationStrategy(
    types: Array<'email' | 'push'>
  ): ICommentNotificationStrategy {
    const strategies: ICommentNotificationStrategy[] = [];

    types.forEach(type => {
      switch (type) {
        case 'email':
          strategies.push(new EmailNotificationStrategy());
          break;
        case 'push':
          strategies.push(new PushNotificationStrategy());
          break;
      }
    });

    return strategies.length === 1 
      ? strategies[0]! // Garantimos que existe pelo menos um
      : strategies.length > 1 
        ? new CompositeNotificationStrategy(strategies)
        : new EmailNotificationStrategy(); // Fallback padrão
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * EXEMPLOS DE USO:
 * 
 * // 1. Estratégia de processamento com moderação:
 * const strategy = CommentStrategyFactory.createProcessingStrategy('moderation');
 * const processedData = await strategy.processBeforeCreate(commentData);
 * 
 * // 2. Múltiplas estratégias de notificação:
 * const notificationStrategy = CommentStrategyFactory.createNotificationStrategy(['email', 'push']);
 * await notificationStrategy.notifyNewComment(comment);
 * 
 * // 3. Filtragem por visibilidade:
 * const filterStrategy = CommentStrategyFactory.createFilterStrategy('visibility');
 * const visibleComments = await filterStrategy.filter(comments, { showHidden: false });
 * 
 * // 4. Combinação de estratégias:
 * const richTextStrategy = new RichTextCommentProcessingStrategy();
 * const moderationStrategy = new ModerationCommentProcessingStrategy();
 * 
 * // Primeiro aplica moderação, depois rich text
 * let processedData = await moderationStrategy.processBeforeCreate(commentData);
 * processedData = await richTextStrategy.processBeforeCreate(processedData);
 */