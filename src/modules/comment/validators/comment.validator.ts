/**
 * @fileoverview Comment Validator
 * @description Implementação do validador para comentários
 * 
 * SOLID PRINCIPLES APPLIED:
 * 
 * 1. Single Responsibility Principle (SRP):
 *    - Responsabilidade única: validar dados de comentários
 *    - Não lida com persistência ou regras de negócio
 *    - Foca apenas em validação de dados
 * 
 * 2. Dependency Inversion Principle (DIP):
 *    - Depende da abstração ICommentRepository
 *    - Não depende de implementações concretas
 *    - Permite injeção de dependências para testes
 * 
 * 3. Open/Closed Principle (OCP):
 *    - Aberto para extensão através de herança
 *    - Fechado para modificação da implementação base
 * 
 * 4. Liskov Substitution Principle (LSP):
 *    - Estende BaseCommentValidator respeitando todos os contratos
 *    - Pode ser substituído por qualquer implementação da classe base
 *    - Mantém comportamento consistente definido na classe base
 */

import { AppError } from "@/shared/errors/app.error";
import { 
  ICommentValidator, 
  ICommentRepository, 
  CreateCommentDto, 
  UpdateCommentDto 
} from "../interfaces/comment.interface";

/**
 * @class CommentValidator
 * @description Implementação concreta do validador de comentários
 * 
 * SOLID: Single Responsibility Principle (SRP) + Liskov Substitution Principle (LSP)
 * - Responsabilidade única: validação de dados de comentários
 * - Não contém lógica de persistência ou regras de negócio
 * - Respeita todos os contratos definidos na classe base
 */
export class CommentValidator implements ICommentValidator {
  /**
   * @constructor
   * @param {ICommentRepository} commentRepository - Repository injetado para verificações
   * 
   * SOLID: Dependency Inversion Principle (DIP)
   * - Recebe dependência como parâmetro
   * - Facilita testes unitários com mocks
   */
  constructor(private readonly commentRepository: ICommentRepository) {}

  /**
   * @method validateCreateData
   * @description Valida dados para criação de comentário
   * @param {CreateCommentDto} data - Dados do comentário
   * @throws {AppError} Se dados inválidos
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Foca apenas na validação dos dados de entrada
   * - Aplica regras de negócio específicas para criação
   */
  async validateCreateData(data: CreateCommentDto): Promise<void> {
    // Validação de conteúdo
    await this.validateContent(data.content);

    // Validação de contexto (aula ou curso)
    await this.validateContext(data.aulaId, data.cursoId);

    // Validação de comentário pai (se for resposta)
    if (data.parentId) {
      await this.validateParentExists(data.parentId);
    }

    // Validação de usuário
    await this.validateUserId(data.userId);
  }

  /**
   * @method validateUpdateData
   * @description Valida dados para atualização de comentário
   * @param {UpdateCommentDto} data - Dados para atualização
   * @throws {AppError} Se dados inválidos
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Foca apenas na validação dos dados de atualização
   * - Reutiliza validações específicas quando possível
   */
  async validateUpdateData(data: UpdateCommentDto): Promise<void> {
    await this.validateContent(data.content);
  }

  /**
   * @method validateOwnership
   * @description Valida se o usuário é proprietário do comentário
   * @param {number} commentId - ID do comentário
   * @param {string} userId - ID do usuário
   * @throws {AppError} Se usuário não é proprietário
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificação de propriedade
   * - Utiliza repository para buscar dados necessários
   */
  async validateOwnership(commentId: number, userId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);

    if (!comment) {
      throw AppError.notFound("Comentário não encontrado");
    }

    if (comment.userId !== userId) {
      throw AppError.forbidden(
        "Você não tem permissão para realizar esta ação neste comentário"
      );
    }
  }

  /**
   * @method validateParentExists
   * @description Valida se o comentário pai existe
   * @param {number} parentId - ID do comentário pai
   * @throws {AppError} Se comentário pai não existe
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: verificação de existência do pai
   * - Evita criação de respostas órfãs
   */
  async validateParentExists(parentId: number): Promise<void> {
    const parentComment = await this.commentRepository.findById(parentId);

    if (!parentComment) {
      throw AppError.badRequest("Comentário pai não encontrado");
    }

    // Regra de negócio: não permitir respostas de respostas (apenas 2 níveis)
    if (parentComment.parentId !== null) {
      throw AppError.badRequest(
        "Não é possível responder a uma resposta. Responda ao comentário principal."
      );
    }
  }

  /**
   * @method validateContent
   * @description Valida o conteúdo do comentário
   * @param {string} content - Conteúdo do comentário
   * @throws {AppError} Se conteúdo inválido
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: validação de conteúdo
   * - Centraliza regras de validação de texto
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Aberto para extensão: novas regras podem ser adicionadas
   * - Fechado para modificação: regras existentes não mudam
   */
  private async validateContent(content: string): Promise<void> {
    if (!content || typeof content !== "string") {
      throw AppError.badRequest("Conteúdo do comentário é obrigatório");
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      throw AppError.badRequest("Conteúdo do comentário não pode estar vazio");
    }

    if (trimmedContent.length < 3) {
      throw AppError.badRequest(
        "Conteúdo do comentário deve ter pelo menos 3 caracteres"
      );
    }

    if (trimmedContent.length > 2000) {
      throw AppError.badRequest(
        "Conteúdo do comentário não pode exceder 2000 caracteres"
      );
    }

    // Validação de conteúdo ofensivo (pode ser expandida)
    await this.validateOffensiveContent(trimmedContent);
  }

  /**
   * @method validateContext
   * @description Valida se o comentário tem contexto válido (aula ou curso)
   * @param {number} aulaId - ID da aula
   * @param {number} cursoId - ID do curso
   * @throws {AppError} Se contexto inválido
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: validação de contexto
   * - Garante que comentário está associado a algo válido
   */
  private async validateContext(aulaId?: number, cursoId?: number): Promise<void> {
    if (!aulaId && !cursoId) {
      throw AppError.badRequest(
        "Comentário deve estar associado a uma aula ou curso"
      );
    }

    if (aulaId && cursoId) {
      throw AppError.badRequest(
        "Comentário não pode estar associado a aula e curso simultaneamente"
      );
    }

    // Aqui poderia haver validação adicional para verificar se aula/curso existem
    // Mas isso seria responsabilidade de um validator específico de aula/curso
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
   * @method validateOffensiveContent
   * @description Valida se o conteúdo não é ofensivo
   * @param {string} content - Conteúdo a ser validado
   * @throws {AppError} Se conteúdo ofensivo
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: detecção de conteúdo ofensivo
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Aberto para extensão: pode integrar com APIs de moderação
   * - Fechado para modificação: lógica básica não muda
   */
  private async validateOffensiveContent(content: string): Promise<void> {
    // Lista básica de palavras proibidas (pode ser expandida ou movida para configuração)
    const forbiddenWords = ["spam", "fake", "scam"];
    
    const lowerContent = content.toLowerCase();
    
    for (const word of forbiddenWords) {
      if (lowerContent.includes(word)) {
        throw AppError.badRequest(
          "Conteúdo contém palavras não permitidas. Por favor, revise seu comentário."
        );
      }
    }

    // Aqui poderia ser integrada uma API de moderação de conteúdo
    // Exemplo: Google Cloud Natural Language API, AWS Comprehend, etc.
  }
}