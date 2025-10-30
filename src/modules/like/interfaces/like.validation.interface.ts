/**
 * @fileoverview Like Validation Interface
 * @description Interface específica para validações de likes
 * 
 * SOLID PRINCIPLE: Interface Segregation Principle (ISP)
 * - Interface focada apenas em validações
 * - Clientes que precisam apenas validar não dependem de outras operações
 * - Permite diferentes estratégias de validação
 */

import type { CreateLikeDto } from './like.interface.js';

/**
 * @interface ILikeDataValidator
 * @description Interface específica para validação de dados de likes
 * 
 * SOLID: ISP - Segregação de validação de dados
 * - Foca apenas na validação de estrutura e formato dos dados
 * - Não inclui validações de negócio ou permissões
 */
export interface ILikeDataValidator {
  /**
   * @method validateCreateData
   * @description Valida dados para criação de like
   */
  validateCreateData(data: CreateLikeDto): Promise<void>;

  /**
   * @method validateUserId
   * @description Valida ID do usuário
   */
  validateUserId(userId: string): Promise<void>;

  /**
   * @method validateTargetId
   * @description Valida ID do alvo (comentário ou aula)
   */
  validateTargetId(commentId?: number, aulaId?: number): Promise<void>;

  /**
   * @method validateSingleTarget
   * @description Valida que apenas um alvo foi especificado
   */
  validateSingleTarget(commentId?: number, aulaId?: number): Promise<void>;
}

/**
 * @interface ILikeBusinessValidator
 * @description Interface específica para validações de regras de negócio
 * 
 * SOLID: ISP - Segregação de validação de negócio
 * - Foca apenas em regras de negócio específicas
 * - Separada da validação de dados estruturais
 */
export interface ILikeBusinessValidator {
  /**
   * @method validateUserExists
   * @description Valida se usuário existe
   */
  validateUserExists(userId: string): Promise<void>;

  /**
   * @method validateCommentExists
   * @description Valida se comentário existe
   */
  validateCommentExists(commentId: number): Promise<void>;

  /**
   * @method validateLessonExists
   * @description Valida se aula existe
   */
  validateLessonExists(aulaId: number): Promise<void>;

  /**
   * @method validateLikeExists
   * @description Valida se like existe
   */
  validateLikeExists(likeId: number): Promise<void>;

  /**
   * @method validateNoDuplicateLike
   * @description Valida que não existe like duplicado
   */
  validateNoDuplicateLike(userId: string, commentId?: number, aulaId?: number): Promise<void>;

  /**
   * @method validateOwnership
   * @description Valida se usuário é dono do like
   */
  validateOwnership(likeId: number, userId: string): Promise<void>;
}

/**
 * @interface ILikePermissionValidator
 * @description Interface específica para validação de permissões
 * 
 * SOLID: ISP - Segregação de validação de permissões
 * - Foca apenas em validações de autorização
 * - Separada de outras validações
 */
export interface ILikePermissionValidator {
  /**
   * @method validateCanLikeComment
   * @description Valida se usuário pode curtir comentário
   */
  validateCanLikeComment(userId: string, commentId: number): Promise<void>;

  /**
   * @method validateCanLikeLesson
   * @description Valida se usuário pode curtir aula
   */
  validateCanLikeLesson(userId: string, aulaId: number): Promise<void>;

  /**
   * @method validateCanUnlike
   * @description Valida se usuário pode descurtir
   */
  validateCanUnlike(userId: string, likeId: number): Promise<void>;

  /**
   * @method validateNotSelfLike
   * @description Valida que usuário não está curtindo próprio conteúdo
   */
  validateNotSelfLike(userId: string, commentId?: number, aulaId?: number): Promise<void>;

  /**
   * @method validateContentAccess
   * @description Valida se usuário tem acesso ao conteúdo
   */
  validateContentAccess(userId: string, commentId?: number, aulaId?: number): Promise<void>;
}

/**
 * @interface ILikeRateLimitValidator
 * @description Interface específica para validação de rate limiting
 * 
 * SOLID: ISP - Segregação de validação de rate limiting
 * - Foca apenas em controle de taxa de likes
 * - Permite diferentes estratégias de rate limiting
 */
export interface ILikeRateLimitValidator {
  /**
   * @method validateUserRateLimit
   * @description Valida se usuário não excedeu limite de likes
   */
  validateUserRateLimit(userId: string): Promise<void>;

  /**
   * @method validateCommentRateLimit
   * @description Valida se comentário não excedeu limite de likes
   */
  validateCommentRateLimit(commentId: number): Promise<void>;

  /**
   * @method validateLessonRateLimit
   * @description Valida se aula não excedeu limite de likes
   */
  validateLessonRateLimit(aulaId: number): Promise<void>;

  /**
   * @method validateGlobalRateLimit
   * @description Valida limite global de likes
   */
  validateGlobalRateLimit(): Promise<void>;

  /**
   * @method validateTimeWindow
   * @description Valida janela de tempo entre likes
   */
  validateTimeWindow(userId: string): Promise<void>;
}

/**
 * @interface ILikeSpamValidator
 * @description Interface específica para validação anti-spam
 * 
 * SOLID: ISP - Segregação de validação anti-spam
 * - Foca apenas em detecção de comportamento suspeito
 * - Permite diferentes estratégias anti-spam
 */
export interface ILikeSpamValidator {
  /**
   * @method validateBotBehavior
   * @description Valida comportamento de bot
   */
  validateBotBehavior(userId: string): Promise<void>;

  /**
   * @method validateSuspiciousPattern
   * @description Valida padrões suspeitos de likes
   */
  validateSuspiciousPattern(userId: string): Promise<void>;

  /**
   * @method validateMassLiking
   * @description Valida likes em massa
   */
  validateMassLiking(userId: string, timeWindow: number): Promise<void>;

  /**
   * @method validateUserReputation
   * @description Valida reputação do usuário
   */
  validateUserReputation(userId: string): Promise<void>;
}

/**
 * @interface ILikeValidationComposer
 * @description Interface para composição de validadores
 * 
 * SOLID: ISP - Interface para orquestração de validações
 * - Permite combinar diferentes tipos de validação
 * - Mantém flexibilidade na escolha de validadores
 */
export interface ILikeValidationComposer {
  /**
   * @method validateForCreate
   * @description Executa todas as validações para criação
   */
  validateForCreate(data: CreateLikeDto): Promise<void>;

  /**
   * @method validateForDelete
   * @description Executa todas as validações para exclusão
   */
  validateForDelete(likeId: number, userId: string): Promise<void>;

  /**
   * @method validateForToggle
   * @description Executa todas as validações para toggle
   */
  validateForToggle(userId: string, commentId?: number, aulaId?: number): Promise<void>;

  /**
   * @method addValidator
   * @description Adiciona um validador à composição
   */
  addValidator(validator: ILikeDataValidator | ILikeBusinessValidator | ILikePermissionValidator | ILikeRateLimitValidator | ILikeSpamValidator): void;

  /**
   * @method removeValidator
   * @description Remove um validador da composição
   */
  removeValidator(validatorType: string): void;

  /**
   * @method setValidationLevel
   * @description Define nível de validação (strict, normal, lenient)
   */
  setValidationLevel(level: 'strict' | 'normal' | 'lenient'): void;
}