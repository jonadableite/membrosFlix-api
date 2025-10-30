/**
 * @fileoverview Like Permission Checker
 * @description Implementação do verificador de permissões para likes
 * 
 * SOLID PRINCIPLES APPLIED:
 * 
 * 1. Single Responsibility Principle (SRP):
 *    - Responsabilidade única: verificar permissões de likes
 *    - Não lida com persistência ou validação de dados
 *    - Foca apenas em autorização
 * 
 * 2. Interface Segregation Principle (ISP):
 *    - Interface específica para permissões de likes
 *    - Não força implementação de métodos desnecessários
 * 
 * 3. Dependency Inversion Principle (DIP):
 *    - Depende da abstração ILikeRepository
 *    - Não depende de implementações concretas
 * 
 * 4. Open/Closed Principle (OCP):
 *    - Aberto para extensão através de herança
 *    - Fechado para modificação da implementação base
 * 
 * 5. Liskov Substitution Principle (LSP):
 *    - Estende BaseLikePermissionChecker respeitando todos os contratos
 *    - Pode ser substituído por qualquer implementação da classe base
 *    - Mantém comportamento consistente definido na classe base
 */

import { 
  ILikePermissionChecker, 
  ILikeRepository 
} from "../interfaces/like.interface";
import { AppError } from "../../../shared/errors/app.error";

/**
 * @enum UserRole
 * @description Enum para definir papéis de usuário no sistema
 * 
 * SOLID: Open/Closed Principle (OCP)
 * - Facilita extensão de novos papéis sem modificar código existente
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
 * 
 * SOLID: Interface Segregation Principle (ISP)
 * - Interface específica para dados de usuário necessários para permissões
 */
export interface UserContext {
  id: string;
  role: UserRole;
  tenantId?: string;
}

/**
 * @class LikePermissionChecker
 * @description Implementação concreta do verificador de permissões de likes
 * 
 * SOLID: Single Responsibility Principle (SRP) + Liskov Substitution Principle (LSP)
 * - Responsabilidade única: verificação de permissões
 * - Não contém lógica de persistência ou validação
 * - Respeita todos os contratos definidos na classe base
 */
export class LikePermissionChecker implements ILikePermissionChecker {
  /**
   * @constructor
   * @param {ILikeRepository} likeRepository - Repository injetado para buscar dados
   * 
   * SOLID: Dependency Inversion Principle (DIP)
   * - Recebe dependência como parâmetro
   * - Facilita testes unitários com mocks
   */
  constructor(private readonly likeRepository: ILikeRepository) {}

  /**
   * @method canLike
   * @description Verifica se usuário pode dar like
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @returns {Promise<boolean>} True se pode dar like
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificar permissão de criação de like
   * - Centraliza todas as regras para dar like
   */
  async canLike(userId: string, commentId?: number, aulaId?: number): Promise<boolean> {
    try {
      // Verificar se usuário é válido
      if (!userId || userId.trim().length === 0) {
        return false;
      }

      // Verificar se já existe like do usuário para este item
      const existingLike = await this.findExistingLike(userId, commentId, aulaId);
      if (existingLike) {
        return false; // Não pode dar like duplicado
      }

      // Verificar se usuário tem acesso ao conteúdo
      return await this.hasAccessToContent(userId, commentId, aulaId);
    } catch {
      return false;
    }
  }

  /**
   * @method canUnlike
   * @description Verifica se usuário pode remover like
   * @param {string} userId - ID do usuário
   * @param {number} likeId - ID do like
   * @returns {Promise<boolean>} True se pode remover like
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificar permissão de remoção de like
   * - Aplica regras específicas para remoção
   */
  async canUnlike(userId: string, likeId: number): Promise<boolean> {
    try {
      const like = await this.likeRepository.findById(likeId);
      if (!like) {
        return false;
      }

      // Proprietário sempre pode remover seu próprio like
      if (like.userId === userId) {
        return true;
      }

      // Administradores e moderadores podem remover qualquer like
      // (Esta verificação seria expandida com contexto de usuário completo)
      return false;
    } catch {
      return false;
    }
  }

  /**
   * @method canViewLikes
   * @description Verifica se usuário pode visualizar likes
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @returns {Promise<boolean>} True se pode visualizar
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificar permissão de visualização
   * - Considera contexto do conteúdo e acesso do usuário
   */
  async canViewLikes(userId: string, commentId?: number, aulaId?: number): Promise<boolean> {
    try {
      // Verificar se usuário tem acesso ao conteúdo
      return await this.hasAccessToContent(userId, commentId, aulaId);
    } catch {
      return false;
    }
  }

  /**
   * @method enforceCanLike
   * @description Força verificação de permissão para dar like
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @throws {AppError} Se não tem permissão
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Combina verificação com tratamento de erro
   * - Simplifica uso em services
   */
  async enforceCanLike(userId: string, commentId?: number, aulaId?: number): Promise<void> {
    const canLike = await this.canLike(userId, commentId, aulaId);
    if (!canLike) {
      const context = commentId ? "comentário" : "aula";
      throw AppError.forbidden(
        `Você não tem permissão para curtir este ${context}`
      );
    }
  }

  /**
   * @method enforceCanUnlike
   * @description Força verificação de permissão para remover like
   * @param {string} userId - ID do usuário
   * @param {number} likeId - ID do like
   * @throws {AppError} Se não tem permissão
   */
  async enforceCanUnlike(userId: string, likeId: number): Promise<void> {
    const canUnlike = await this.canUnlike(userId, likeId);
    if (!canUnlike) {
      throw AppError.forbidden(
        "Você não tem permissão para remover este like"
      );
    }
  }

  /**
   * @method findExistingLike
   * @description Busca like existente do usuário para o conteúdo
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @returns {Promise<any>} Like existente ou null
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: buscar like existente
   * - Método auxiliar reutilizável
   */
  private async findExistingLike(
    userId: string,
    commentId?: number,
    aulaId?: number
  ): Promise<any> {
    return await this.likeRepository.findByUser(userId, aulaId, commentId);
  }

  /**
   * @method hasAccessToContent
   * @description Verifica se usuário tem acesso ao conteúdo
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @returns {Promise<boolean>} True se tem acesso
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificar acesso a conteúdo
   * - Centraliza lógica de acesso
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Aberto para extensão: diferentes tipos de acesso podem ser adicionados
   * - Fechado para modificação: lógica base não muda
   */
  private async hasAccessToContent(
    _userId: string,
    _commentId?: number,
    _aulaId?: number
  ): Promise<boolean> {
    // Esta implementação seria expandida para verificar se o usuário
    // tem acesso ao comentário/aula através de repositories específicos
    // Por ora, retorna true como placeholder
    
    // TODO: Implementar verificação real com repositories de:
    // - Matrícula (para aulas)
    // - Permissões de comentários
    // - Contexto de tenant/organização
    
    // Verificações que poderiam ser implementadas:
    // 1. Se é comentário: verificar se usuário tem acesso à aula/curso do comentário
    // 2. Se é aula: verificar se usuário está matriculado no curso
    // 3. Verificar se conteúdo não está bloqueado/privado
    // 4. Verificar se usuário não está suspenso
    
    return true;
  }

  /**
   * @method canModerate
   * @description Verifica se usuário pode moderar likes
   * @param {UserContext} user - Contexto do usuário
   * @returns {boolean} True se pode moderar
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificar permissão de moderação
   * - Centraliza regras de moderação
   */
  canModerate(user: UserContext): boolean {
    return user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR;
  }

  /**
   * @method canViewAllLikes
   * @description Verifica se usuário pode visualizar todos os likes
   * @param {UserContext} user - Contexto do usuário
   * @returns {boolean} True se pode visualizar todos
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificar permissão de visualização ampla
   * - Útil para relatórios e moderação
   */
  canViewAllLikes(user: UserContext): boolean {
    return this.canModerate(user);
  }

  /**
   * @method canDeleteAnyLike
   * @description Verifica se usuário pode deletar qualquer like
   * @param {UserContext} user - Contexto do usuário
   * @returns {boolean} True se pode deletar qualquer like
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificar permissão de exclusão ampla
   * - Útil para moderação e administração
   */
  canDeleteAnyLike(user: UserContext): boolean {
    return user.role === UserRole.ADMIN;
  }

  /**
   * @method validateRateLimit
   * @description Valida se usuário não excedeu limite de likes
   * @param {string} userId - ID do usuário
   * @returns {Promise<boolean>} True se dentro do limite
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificação de rate limiting
   * - Pode ser expandida para diferentes tipos de limites
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Aberto para extensão: diferentes estratégias de rate limiting
   * - Fechado para modificação: lógica base não muda
   */
  async validateRateLimit(_userId: string): Promise<boolean> {
    // Esta implementação seria expandida para verificar:
    // - Número de likes nas últimas horas/dias
    // - Limites específicos por tipo de usuário
    // - Integração com sistema de rate limiting (Redis, etc.)
    
    // TODO: Implementar verificação real de rate limiting
    // Exemplo: máximo 100 likes por hora, 500 por dia
    
    return true;
  }
}