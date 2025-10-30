/**
 * @fileoverview Like Module Interfaces
 * @description Definição de interfaces para o módulo de likes seguindo os princípios SOLID
 * 
 * SOLID PRINCIPLES APPLIED:
 * 
 * 1. Interface Segregation Principle (ISP):
 *    - Interfaces específicas e coesas para cada responsabilidade
 *    - Clientes não dependem de métodos que não utilizam
 * 
 * 2. Single Responsibility Principle (SRP):
 *    - Cada interface tem uma responsabilidade bem definida
 *    - Separação clara entre persistência, validação, permissões e serviço
 * 
 * 3. Dependency Inversion Principle (DIP):
 *    - Define abstrações que serão implementadas por classes concretas
 *    - Permite inversão de dependências e facilita testes
 */

import { Like } from '@prisma/client';

/**
 * @interface CreateLikeDto
 * @description DTO para criação de like
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface específica para dados de criação de like
 * - Contém apenas campos necessários para criação
 */
export interface CreateLikeDto {
  userId: string;
  commentId?: number;
  aulaId?: number;
}

/**
 * @interface LikeResponseDto
 * @description DTO para resposta de like
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface específica para dados de resposta
 * - Inclui informações completas do like
 */
export interface LikeResponseDto {
  id: number;
  userId: string;
  commentId?: number | null;
  aulaId?: number | null;
  cursoId?: number | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

/**
 * @interface LikeStatsDto
 * @description DTO para estatísticas de likes
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface específica para estatísticas
 * - Separada dos dados do like em si
 */
export interface LikeStatsDto {
  totalLikes: number;
  userHasLiked: boolean;
  likeId?: number | null;
}

/**
 * @interface ILikeRepository
 * @description Interface para operações de persistência de likes
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface coesa focada apenas em persistência
 * - Métodos específicos para operações de banco de dados
 * 
 * SOLID: Single Responsibility Principle (SRP)
 * - Responsabilidade única: acesso a dados de likes
 * - Não contém lógica de negócio ou validação
 * 
 * SOLID: Dependency Inversion Principle (DIP)
 * - Abstração que pode ser implementada por diferentes repositories
 * - Facilita testes com mocks e diferentes implementações
 */
export interface ILikeRepository {
  /**
   * @method create
   * @description Cria um novo like
   * @param {CreateLikeDto} data - Dados do like
   * @returns {Promise<LikeResponseDto>} Like criado
   */
  create(data: CreateLikeDto): Promise<LikeResponseDto>;

  /**
   * @method findById
   * @description Busca like por ID
   * @param {number} id - ID do like
   * @returns {Promise<Like | null>} Like encontrado ou null
   */
  findById(id: number): Promise<Like | null>;

  /**
   * @method findByUser
   * @description Busca like por usuário e conteúdo
   * @param {string} userId - ID do usuário
   * @param {number} aulaId - ID da aula (opcional)
   * @param {number} commentId - ID do comentário (opcional)
   * @returns {Promise<Like | null>} Like encontrado ou null
   */
  findByUser(userId: string, aulaId?: number, commentId?: number): Promise<Like | null>;

  /**
   * @method delete
   * @description Remove um like
   * @param {number} id - ID do like
   * @returns {Promise<void>} Void quando removido com sucesso
   */
  delete(id: number): Promise<void>;
}

/**
 * @interface ILikeValidator
 * @description Interface para validação de likes
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface coesa focada apenas em validação
 * - Métodos específicos para diferentes tipos de validação
 * 
 * SOLID: Single Responsibility Principle (SRP)
 * - Responsabilidade única: validação de dados e regras de negócio
 * - Não contém lógica de persistência ou apresentação
 */
export interface ILikeValidator {
  /**
   * @method validateCreateData
   * @description Valida dados para criação de like
   * @param {CreateLikeDto} data - Dados do like
   * @throws {AppError} Se dados inválidos
   */
  validateCreateData(data: CreateLikeDto): Promise<void>;

  /**
   * @method validateToggleData
   * @description Valida dados para toggle de like
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @throws {AppError} Se dados inválidos
   */
  validateToggleData(userId: string, commentId?: number, aulaId?: number): Promise<void>;

  /**
   * @method validateNoDuplicateLike
   * @description Valida se não existe like duplicado
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @throws {AppError} Se like já existe
   */
  validateNoDuplicateLike(userId: string, commentId?: number, aulaId?: number): Promise<void>;
}

/**
 * @interface ILikePermissionChecker
 * @description Interface para verificação de permissões de likes
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface coesa focada apenas em permissões
 * - Métodos específicos para diferentes operações
 * 
 * SOLID: Single Responsibility Principle (SRP)
 * - Responsabilidade única: verificação de permissões e autorização
 * - Não contém lógica de validação ou persistência
 */
export interface ILikePermissionChecker {
  /**
   * @method canLike
   * @description Verifica se usuário pode dar like
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @returns {Promise<boolean>} True se pode dar like
   */
  canLike(userId: string, commentId?: number, aulaId?: number): Promise<boolean>;

  /**
   * @method canUnlike
   * @description Verifica se usuário pode remover like
   * @param {string} userId - ID do usuário
   * @param {number} likeId - ID do like
   * @returns {Promise<boolean>} True se pode remover like
   */
  canUnlike(userId: string, likeId: number): Promise<boolean>;

  /**
   * @method canViewLikes
   * @description Verifica se usuário pode visualizar likes
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @returns {Promise<boolean>} True se pode visualizar
   */
  canViewLikes(userId: string, commentId?: number, aulaId?: number): Promise<boolean>;

  /**
   * @method enforceCanLike
   * @description Força verificação de permissão para dar like
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @throws {AppError} Se não tem permissão
   */
  enforceCanLike(userId: string, commentId?: number, aulaId?: number): Promise<void>;

  /**
   * @method enforceCanUnlike
   * @description Força verificação de permissão para remover like
   * @param {string} userId - ID do usuário
   * @param {number} likeId - ID do like
   * @throws {AppError} Se não tem permissão
   */
  enforceCanUnlike(userId: string, likeId: number): Promise<void>;
}

/**
 * @interface ILikeService
 * @description Interface principal do serviço de likes
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface coesa com operações de alto nível
 * - Métodos focados em casos de uso do negócio
 * 
 * SOLID: Single Responsibility Principle (SRP)
 * - Responsabilidade única: orquestração de operações de likes
 * - Coordena validação, permissões e persistência
 * 
 * SOLID: Liskov Substitution Principle (LSP)
 * - Define contrato que implementações devem seguir
 * - Permite substituição por diferentes implementações
 */
export interface ILikeService {
  /**
   * @method toggleCommentLike
   * @description Alterna like em comentário
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário
   * @returns {Promise<LikeStatsDto>} Estatísticas atualizadas
   */
  toggleCommentLike(userId: string, commentId: number): Promise<LikeStatsDto>;

  /**
   * @method toggleLessonLike
   * @description Alterna like em aula
   * @param {string} userId - ID do usuário
   * @param {number} aulaId - ID da aula
   * @returns {Promise<LikeStatsDto>} Estatísticas atualizadas
   */
  toggleLessonLike(userId: string, aulaId: number): Promise<LikeStatsDto>;

  /**
   * @method getCommentLikeStats
   * @description Obtém estatísticas de likes de comentário
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário
   * @returns {Promise<LikeStatsDto>} Estatísticas do comentário
   */
  getCommentLikeStats(userId: string, commentId: number): Promise<LikeStatsDto>;

  /**
   * @method getLessonLikeStats
   * @description Obtém estatísticas de likes de aula
   * @param {string} userId - ID do usuário
   * @param {number} aulaId - ID da aula
   * @returns {Promise<LikeStatsDto>} Estatísticas da aula
   */
  getLessonLikeStats(userId: string, aulaId: number): Promise<LikeStatsDto>;
}