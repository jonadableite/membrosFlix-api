/**
 * @fileoverview Comment Validation Interface
 * @description Interface específica para validações de comentários
 * 
 * SOLID PRINCIPLE: Interface Segregation Principle (ISP)
 * - Interface focada apenas em validações
 * - Clientes que precisam apenas validar não dependem de outras operações
 * - Permite diferentes estratégias de validação
 */

import type { CreateCommentDto, UpdateCommentDto } from './comment.interface.js';

/**
 * @interface ICommentDataValidator
 * @description Interface específica para validação de dados de comentários
 * 
 * SOLID: ISP - Segregação de validação de dados
 * - Foca apenas na validação de estrutura e formato dos dados
 * - Não inclui validações de negócio ou permissões
 */
export interface ICommentDataValidator {
  /**
   * @method validateCreateData
   * @description Valida dados para criação de comentário
   */
  validateCreateData(data: CreateCommentDto): Promise<void>;

  /**
   * @method validateUpdateData
   * @description Valida dados para atualização de comentário
   */
  validateUpdateData(data: UpdateCommentDto): Promise<void>;

  /**
   * @method validateContent
   * @description Valida conteúdo do comentário
   */
  validateContent(content: string): Promise<void>;

  /**
   * @method validateUserId
   * @description Valida ID do usuário
   */
  validateUserId(userId: string): Promise<void>;

  /**
   * @method validateIds
   * @description Valida IDs de aula/curso
   */
  validateIds(aulaId?: number, cursoId?: number): Promise<void>;
}

/**
 * @interface ICommentBusinessValidator
 * @description Interface específica para validações de regras de negócio
 * 
 * SOLID: ISP - Segregação de validação de negócio
 * - Foca apenas em regras de negócio específicas
 * - Separada da validação de dados estruturais
 */
export interface ICommentBusinessValidator {
  /**
   * @method validateOwnership
   * @description Valida se usuário é dono do comentário
   */
  validateOwnership(commentId: number, userId: string): Promise<void>;

  /**
   * @method validateParentExists
   * @description Valida se comentário pai existe
   */
  validateParentExists(parentId: number): Promise<void>;

  /**
   * @method validateLessonExists
   * @description Valida se aula existe
   */
  validateLessonExists(aulaId: number): Promise<void>;

  /**
   * @method validateCourseExists
   * @description Valida se curso existe
   */
  validateCourseExists(cursoId: number): Promise<void>;

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
}

/**
 * @interface ICommentContentValidator
 * @description Interface específica para validação de conteúdo
 * 
 * SOLID: ISP - Segregação de validação de conteúdo
 * - Foca apenas na validação do conteúdo textual
 * - Permite diferentes estratégias de moderação
 */
export interface ICommentContentValidator {
  /**
   * @method validateProfanity
   * @description Valida se conteúdo contém palavrões
   */
  validateProfanity(content: string): Promise<void>;

  /**
   * @method validateSpam
   * @description Valida se conteúdo é spam
   */
  validateSpam(content: string, userId: string): Promise<void>;

  /**
   * @method validateLength
   * @description Valida tamanho do conteúdo
   */
  validateLength(content: string): Promise<void>;

  /**
   * @method validateFormat
   * @description Valida formato do conteúdo (HTML, Markdown, etc.)
   */
  validateFormat(content: string): Promise<void>;

  /**
   * @method validateLinks
   * @description Valida links no conteúdo
   */
  validateLinks(content: string): Promise<void>;

  /**
   * @method validateMentions
   * @description Valida menções a usuários
   */
  validateMentions(content: string): Promise<void>;
}

/**
 * @interface ICommentRateLimitValidator
 * @description Interface específica para validação de rate limiting
 * 
 * SOLID: ISP - Segregação de validação de rate limiting
 * - Foca apenas em controle de taxa de comentários
 * - Permite diferentes estratégias de rate limiting
 */
export interface ICommentRateLimitValidator {
  /**
   * @method validateUserRateLimit
   * @description Valida se usuário não excedeu limite de comentários
   */
  validateUserRateLimit(userId: string): Promise<void>;

  /**
   * @method validateLessonRateLimit
   * @description Valida se aula não excedeu limite de comentários
   */
  validateLessonRateLimit(aulaId: number): Promise<void>;

  /**
   * @method validateReplyRateLimit
   * @description Valida se comentário pai não excedeu limite de respostas
   */
  validateReplyRateLimit(parentId: number): Promise<void>;

  /**
   * @method validateGlobalRateLimit
   * @description Valida limite global de comentários
   */
  validateGlobalRateLimit(): Promise<void>;
}

/**
 * @interface ICommentValidationComposer
 * @description Interface para composição de validadores
 * 
 * SOLID: ISP - Interface para orquestração de validações
 * - Permite combinar diferentes tipos de validação
 * - Mantém flexibilidade na escolha de validadores
 */
export interface ICommentValidationComposer {
  /**
   * @method validateForCreate
   * @description Executa todas as validações para criação
   */
  validateForCreate(data: CreateCommentDto): Promise<void>;

  /**
   * @method validateForUpdate
   * @description Executa todas as validações para atualização
   */
  validateForUpdate(commentId: number, userId: string, data: UpdateCommentDto): Promise<void>;

  /**
   * @method validateForDelete
   * @description Executa todas as validações para exclusão
   */
  validateForDelete(commentId: number, userId: string): Promise<void>;

  /**
   * @method addValidator
   * @description Adiciona um validador à composição
   */
  addValidator(validator: ICommentDataValidator | ICommentBusinessValidator | ICommentContentValidator | ICommentRateLimitValidator): void;

  /**
   * @method removeValidator
   * @description Remove um validador da composição
   */
  removeValidator(validatorType: string): void;
}