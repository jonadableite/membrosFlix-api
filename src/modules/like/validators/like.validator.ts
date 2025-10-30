/**
 * @fileoverview Like Validator
 * @description Implementação do validador para likes
 * 
 * SOLID PRINCIPLES APPLIED:
 * 
 * 1. Single Responsibility Principle (SRP):
 *    - Responsabilidade única: validar dados de likes
 *    - Não lida com persistência ou regras de negócio
 *    - Foca apenas em validação de dados
 * 
 * 2. Dependency Inversion Principle (DIP):
 *    - Depende da abstração ILikeRepository
 *    - Não depende de implementações concretas
 *    - Permite injeção de dependências para testes
 * 
 * 3. Open/Closed Principle (OCP):
 *    - Aberto para extensão através de herança
 *    - Fechado para modificação da implementação base
 * 
 * 4. Liskov Substitution Principle (LSP):
 *    - Estende BaseLikeValidator respeitando todos os contratos
 *    - Pode ser substituído por qualquer implementação da classe base
 *    - Mantém comportamento consistente definido na classe base
 */

import { 
  ILikeValidator, 
  ILikeRepository, 
  CreateLikeDto 
} from '../interfaces/like.interface.js';
import { AppError } from '../../../shared/errors/app.error.js';

/**
 * @class LikeValidator
 * @description Implementação concreta do validador de likes
 * 
 * SOLID: Single Responsibility Principle (SRP) + Liskov Substitution Principle (LSP)
 * - Responsabilidade única: validação de dados de likes
 * - Não contém lógica de persistência ou regras de negócio
 * - Respeita todos os contratos definidos na classe base
 */
export class LikeValidator implements ILikeValidator {
  /**
   * @constructor
   * @param {ILikeRepository} likeRepository - Repository injetado para verificações
   * 
   * SOLID: Dependency Inversion Principle (DIP)
   * - Recebe dependência como parâmetro
   * - Facilita testes unitários com mocks
   */
  constructor(private readonly likeRepository: ILikeRepository) {}

  /**
   * @method validateCreateData
   * @description Valida dados para criação de like
   * @param {CreateLikeDto} data - Dados do like
   * @throws {AppError} Se dados inválidos
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Foca apenas na validação dos dados de entrada
   * - Aplica regras de negócio específicas para criação
   */
  async validateCreateData(data: CreateLikeDto): Promise<void> {
    // Validação de usuário
    await this.validateUserId(data.userId);

    // Validação de contexto (comentário ou aula)
    await this.validateContext(data.commentId, data.aulaId);

    // Validação de duplicação
    await this.validateNoDuplicateLike(data.userId, data.aulaId, data.commentId);
  }

  /**
   * @method validateToggleData
   * @description Valida dados para toggle de like
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @throws {AppError} Se dados inválidos
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Foca apenas na validação dos dados de toggle
   * - Reutiliza validações específicas quando possível
   */
  async validateToggleData(userId: string, commentId?: number, aulaId?: number): Promise<void> {
    // Validação de usuário
    await this.validateUserId(userId);

    // Validação de contexto (comentário ou aula)
    await this.validateContext(commentId, aulaId);
  }

  /**
   * @method validateNoDuplicateLike
   * @description Valida se não existe like duplicado
   * @param {string} userId - ID do usuário
   * @param {number} aulaId - ID da aula (opcional)
   * @param {number} commentId - ID do comentário (opcional)
   * @throws {AppError} Se like já existe
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificação de duplicação
   * - Utiliza repository para buscar dados necessários
   */
  async validateNoDuplicateLike(
    userId: string,
    aulaId?: number,
    commentId?: number
  ): Promise<void> {
    const existingLike = await this.likeRepository.findByUser(userId, aulaId, commentId);

    if (existingLike) {
      const context = commentId ? "comentário" : "aula";
      throw AppError.badRequest(`Você já curtiu este ${context}`);
    }
  }

  /**
   * @method validateUserId
   * @description Valida se o ID do usuário é válido
   * @param {string} userId - ID do usuário
   * @throws {AppError} Se ID inválido
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: validação de usuário
   * - Pode ser expandida para verificar se usuário existe
   */
  private async validateUserId(userId: string): Promise<void> {
    if (!userId || typeof userId !== "string") {
      throw AppError.badRequest("ID do usuário é obrigatório");
    }

    if (userId.trim().length === 0) {
      throw AppError.badRequest("ID do usuário não pode estar vazio");
    }
  }

  /**
   * @method validateContext
   * @description Valida se o like tem contexto válido (comentário ou aula)
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @throws {AppError} Se contexto inválido
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: validação de contexto
   * - Garante que like está associado a algo válido
   */
  private async validateContext(commentId?: number, aulaId?: number): Promise<void> {
    if (!commentId && !aulaId) {
      throw AppError.badRequest(
        "Like deve estar associado a um comentário ou aula"
      );
    }

    if (commentId && aulaId) {
      throw AppError.badRequest(
        "Like não pode estar associado a comentário e aula simultaneamente"
      );
    }

    // Validação de IDs numéricos
    if (commentId !== undefined) {
      await this.validateNumericId(commentId, "comentário");
    }

    if (aulaId !== undefined) {
      await this.validateNumericId(aulaId, "aula");
    }
  }

  /**
   * @method validateNumericId
   * @description Valida se um ID numérico é válido
   * @param {number} id - ID a ser validado
   * @param {string} context - Contexto do ID (para mensagem de erro)
   * @throws {AppError} Se ID inválido
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: validação de ID numérico
   * - Método auxiliar reutilizável
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Aberto para extensão: pode ser usado para diferentes tipos de ID
   * - Fechado para modificação: lógica de validação não muda
   */
  private async validateNumericId(id: number, context: string): Promise<void> {
    if (!Number.isInteger(id) || id <= 0) {
      throw AppError.badRequest(`ID do ${context} deve ser um número inteiro positivo`);
    }
  }

  /**
   * @method validateLikeExists
   * @description Valida se um like existe
   * @param {number} likeId - ID do like
   * @throws {AppError} Se like não existe
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificação de existência de like
   * - Utiliza repository para buscar dados
   */
  async validateLikeExists(likeId: number): Promise<void> {
    await this.validateNumericId(likeId, "like");

    const like = await this.likeRepository.findById(likeId);
    if (!like) {
      throw AppError.notFound("Like não encontrado");
    }
  }

  /**
   * @method validateLikeOwnership
   * @description Valida se o usuário é proprietário do like
   * @param {number} likeId - ID do like
   * @param {string} userId - ID do usuário
   * @throws {AppError} Se usuário não é proprietário
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificação de propriedade
   * - Utiliza repository para buscar dados necessários
   */
  async validateLikeOwnership(likeId: number, userId: string): Promise<void> {
    const like = await this.likeRepository.findById(likeId);

    if (!like) {
      throw AppError.notFound("Like não encontrado");
    }

    if (like.userId !== userId) {
      throw AppError.forbidden(
        "Você não tem permissão para realizar esta ação neste like"
      );
    }
  }

  /**
   * @method validateTogglePermission
   * @description Valida permissões para toggle de like
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário (opcional)
   * @param {number} aulaId - ID da aula (opcional)
   * @throws {AppError} Se não tem permissão
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: validação de permissões para toggle
   * - Centraliza regras de autorização para likes
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Aberto para extensão: novas regras de permissão podem ser adicionadas
   * - Fechado para modificação: regras existentes não mudam
   */
  async validateTogglePermission(
    userId: string,
    _commentId?: number,
    _aulaId?: number
  ): Promise<void> {
    // Por enquanto, qualquer usuário autenticado pode dar like
    // Esta validação pode ser expandida para incluir:
    // - Verificação se usuário tem acesso ao conteúdo
    // - Verificação se usuário não está bloqueado
    // - Verificação de limites de rate limiting
    
    await this.validateUserId(userId);

    // Aqui poderia haver validação adicional para verificar se:
    // - O usuário tem acesso ao comentário/aula
    // - O usuário não está em uma lista de bloqueio
    // - Não há limitações de rate limiting
    
    // TODO: Implementar verificações adicionais conforme necessário
  }
}