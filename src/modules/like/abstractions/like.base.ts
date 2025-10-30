/**
 * @fileoverview Like Base Classes
 * @description Classes base abstratas para garantir Liskov Substitution Principle
 * 
 * SOLID PRINCIPLES APPLIED:
 * 
 * 1. Liskov Substitution Principle (LSP):
 *    - Classes derivadas devem ser substituíveis por suas classes base
 *    - Contratos bem definidos que devem ser respeitados
 *    - Comportamento consistente em toda a hierarquia
 * 
 * 2. Single Responsibility Principle (SRP):
 *    - Cada classe base tem uma responsabilidade específica
 *    - Separação clara entre diferentes tipos de operações
 * 
 * 3. Open/Closed Principle (OCP):
 *    - Aberto para extensão através de herança
 *    - Fechado para modificação das classes base
 */

import { Like } from "@prisma/client";
import { 
  CreateLikeDto, 
  LikeResponseDto, 
  LikeStatsDto 
} from '../interfaces/like.interface.js';

// ============================================================================
// BASE REPOSITORY (LSP)
// ============================================================================

/**
 * @abstract class BaseLikeRepository
 * @description Classe base para repositórios de likes
 * 
 * SOLID: Liskov Substitution Principle (LSP)
 * - Define contrato que todas as implementações devem seguir
 * - Garante comportamento consistente em todas as subclasses
 * - Permite substituição transparente entre implementações
 */
export abstract class BaseLikeRepository {
  /**
   * Cria um novo like
   * 
   * LSP CONTRACT:
   * - DEVE retornar um like válido quando dados válidos são fornecidos
   * - DEVE lançar erro quando dados inválidos são fornecidos
   * - NÃO DEVE criar like duplicado (mesmo usuário, mesmo conteúdo)
   */
  abstract create(data: CreateLikeDto): Promise<LikeResponseDto>;

  /**
   * Busca like por ID
   * 
   * LSP CONTRACT:
   * - DEVE retornar like quando ID existe
   * - DEVE retornar null quando ID não existe
   * - NÃO DEVE lançar erro para IDs inexistentes
   */
  abstract findById(id: number): Promise<Like | null>;

  /**
   * Busca like específico do usuário
   * 
   * LSP CONTRACT:
   * - DEVE retornar like quando existe
   * - DEVE retornar null quando não existe
   * - DEVE considerar apenas um tipo de conteúdo por vez (aula OU comentário)
   */
  abstract findByUser(userId: string, aulaId?: number, commentId?: number): Promise<Like | null>;

  /**
   * Remove like
   * 
   * LSP CONTRACT:
   * - DEVE remover like quando ID existe
   * - DEVE lançar erro quando ID não existe
   * - DEVE ser idempotente para o mesmo like
   */
  abstract delete(id: number): Promise<void>;

  /**
   * Remove like por usuário e conteúdo
   * 
   * LSP CONTRACT:
   * - DEVE remover like quando existe
   * - DEVE retornar false quando não existe
   * - DEVE ser idempotente
   */
  abstract deleteByUser(userId: string, aulaId?: number, commentId?: number): Promise<boolean>;

  /**
   * Conta likes por conteúdo
   * 
   * LSP CONTRACT:
   * - DEVE retornar número >= 0
   * - DEVE considerar apenas um tipo de conteúdo por vez
   * - DEVE ser consistente com findByContent
   */
  abstract countByContent(aulaId?: number, commentId?: number): Promise<number>;

  /**
   * Busca likes por conteúdo
   * 
   * LSP CONTRACT:
   * - DEVE retornar array (vazio se nenhum like)
   * - DEVE considerar apenas um tipo de conteúdo por vez
   * - DEVE ordenar por data de criação (mais recente primeiro)
   */
  abstract findByContent(aulaId?: number, commentId?: number): Promise<Like[]>;

  /**
   * Verifica se like existe
   * 
   * LSP CONTRACT:
   * - DEVE retornar boolean
   * - DEVE ser consistente com findByUser
   * - DEVE ser mais eficiente que findByUser quando possível
   */
  async exists(userId: string, aulaId?: number, commentId?: number): Promise<boolean> {
    const like = await this.findByUser(userId, aulaId, commentId);
    return like !== null;
  }

  /**
   * Obtém estatísticas de likes
   * 
   * LSP CONTRACT:
   * - DEVE retornar objeto com estatísticas válidas
   * - DEVE considerar apenas um tipo de conteúdo por vez
   * - DEVE ser consistente com count methods
   */
  async getStats(aulaId?: number, commentId?: number): Promise<LikeStatsDto> {
    const totalLikes = await this.countByContent(aulaId, commentId);

    return {
      totalLikes,
      userHasLiked: false, // Será definido pela implementação específica
      likeId: null,
    };
  }

  /**
   * Busca likes com paginação
   * 
   * LSP CONTRACT:
   * - DEVE retornar objeto com data e metadata
   * - DEVE respeitar limites de paginação
   * - DEVE ser consistente com count method
   */
  async findWithPagination(
    aulaId?: number,
    commentId?: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: Like[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Validação de entrada (LSP: comportamento consistente)
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Limite máximo para performance

    const [data, total] = await Promise.all([
      this.findByContent(aulaId, commentId),
      this.countByContent(aulaId, commentId)
    ]);

    // Aplicar paginação
    const offset = (page - 1) * limit;
    const paginatedData = data.slice(offset, offset + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

// ============================================================================
// BASE VALIDATOR (LSP)
// ============================================================================

/**
 * @abstract class BaseLikeValidator
 * @description Classe base para validadores de likes
 * 
 * SOLID: Liskov Substitution Principle (LSP)
 * - Define contrato de validação que todas as implementações devem seguir
 * - Garante comportamento consistente de validação
 * - Permite diferentes estratégias de validação mantendo interface
 */
export abstract class BaseLikeValidator {
  /**
   * Valida dados para criação de like
   * 
   * LSP CONTRACT:
   * - DEVE lançar erro com mensagem clara se dados inválidos
   * - DEVE retornar void se dados válidos
   * - NÃO DEVE modificar dados de entrada
   */
  abstract validateCreate(data: CreateLikeDto): Promise<void>;

  /**
   * Valida se like pode ser removido
   * 
   * LSP CONTRACT:
   * - DEVE lançar erro se não pode ser removido
   * - DEVE retornar void se pode ser removido
   * - DEVE verificar regras de negócio
   */
  abstract validateDelete(userId: string, aulaId?: number, commentId?: number): Promise<void>;

  /**
   * Valida se conteúdo existe e pode receber likes
   * 
   * LSP CONTRACT:
   * - DEVE lançar erro se conteúdo não existe
   * - DEVE lançar erro se conteúdo não pode receber likes
   * - DEVE retornar void se conteúdo é válido
   */
  abstract validateContent(aulaId?: number, commentId?: number): Promise<void>;

  /**
   * Valida dados de entrada básicos
   * 
   * LSP CONTRACT:
   * - DEVE verificar tipos e formatos
   * - DEVE lançar erro com mensagem clara se inválido
   * - DEVE ser consistente entre todas as implementações
   */
  protected validateBasicInput(data: CreateLikeDto): void {
    if (!data.userId || typeof data.userId !== 'string' || !data.userId.trim()) {
      throw new Error("ID do usuário é obrigatório e deve ser uma string não vazia");
    }

    // Deve ter exatamente um tipo de conteúdo
    const hasAulaId = data.aulaId !== undefined && data.aulaId !== null;
    const hasCommentId = data.commentId !== undefined && data.commentId !== null;

    if (!hasAulaId && !hasCommentId) {
      throw new Error("Deve especificar ID da aula ou ID do comentário");
    }

    if (hasAulaId && hasCommentId) {
      throw new Error("Não pode especificar ID da aula e ID do comentário ao mesmo tempo");
    }

    if (hasAulaId && (typeof data.aulaId !== 'number' || data.aulaId <= 0)) {
      throw new Error("ID da aula deve ser um número positivo");
    }

    if (hasCommentId && (typeof data.commentId !== 'number' || data.commentId <= 0)) {
      throw new Error("ID do comentário deve ser um número positivo");
    }
  }

  /**
   * Valida se usuário pode dar like
   * 
   * LSP CONTRACT:
   * - DEVE verificar se usuário existe e está ativo
   * - DEVE verificar rate limits se aplicável
   * - DEVE retornar void se usuário pode dar like
   */
  protected async validateUser(userId: string): Promise<void> {
    if (!userId || !userId.trim()) {
      throw new Error("ID do usuário não pode estar vazio");
    }

    // Validações básicas de formato
    if (userId.length < 3) {
      throw new Error("ID do usuário deve ter pelo menos 3 caracteres");
    }

    if (userId.length > 50) {
      throw new Error("ID do usuário não pode ter mais de 50 caracteres");
    }

    // Validação de caracteres permitidos
    const validUserIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validUserIdPattern.test(userId)) {
      throw new Error("ID do usuário contém caracteres inválidos");
    }
  }
}

// ============================================================================
// BASE PERMISSION CHECKER (LSP)
// ============================================================================

/**
 * @abstract class BaseLikePermissionChecker
 * @description Classe base para verificadores de permissão de likes
 * 
 * SOLID: Liskov Substitution Principle (LSP)
 * - Define contrato de permissões que todas as implementações devem seguir
 * - Garante comportamento consistente de autorização
 * - Permite diferentes políticas de permissão mantendo interface
 */
export abstract class BaseLikePermissionChecker {
  /**
   * Verifica se usuário pode dar like em aula
   * 
   * LSP CONTRACT:
   * - DEVE retornar true se usuário pode dar like
   * - DEVE retornar false se usuário não pode dar like
   * - NÃO DEVE lançar erro (usar return false)
   */
  abstract canLikeLesson(userId: string, aulaId: number): Promise<boolean>;

  /**
   * Verifica se usuário pode dar like em comentário
   * 
   * LSP CONTRACT:
   * - DEVE retornar true se usuário pode dar like
   * - DEVE retornar false se usuário não pode dar like
   * - DEVE verificar se comentário existe e está visível
   */
  abstract canLikeComment(userId: string, commentId: number): Promise<boolean>;

  /**
   * Verifica se usuário pode remover like
   * 
   * LSP CONTRACT:
   * - DEVE retornar true se usuário pode remover
   * - DEVE retornar false se usuário não pode remover
   * - DEVE verificar propriedade do like
   */
  abstract canUnlike(userId: string, aulaId?: number, commentId?: number): Promise<boolean>;

  /**
   * Verifica se usuário pode visualizar likes
   * 
   * LSP CONTRACT:
   * - DEVE retornar true se usuário pode visualizar
   * - DEVE retornar false se usuário não pode visualizar
   * - DEVE considerar privacidade do conteúdo
   */
  abstract canViewLikes(userId: string, aulaId?: number, commentId?: number): Promise<boolean>;

  /**
   * Verifica se usuário pode moderar likes
   * 
   * LSP CONTRACT:
   * - DEVE retornar true se usuário é moderador
   * - DEVE retornar false se usuário não é moderador
   * - DEVE ser consistente em toda a aplicação
   */
  abstract canModerate(userId: string): Promise<boolean>;

  /**
   * Verifica múltiplas permissões de uma vez
   * 
   * LSP CONTRACT:
   * - DEVE retornar objeto com todas as permissões verificadas
   * - DEVE ser mais eficiente que chamadas individuais quando possível
   * - DEVE ser consistente com métodos individuais
   */
  async checkMultiplePermissions(
    userId: string,
    aulaId?: number,
    commentId?: number
  ): Promise<{
    canLike: boolean;
    canUnlike: boolean;
    canView: boolean;
    canModerate: boolean;
  }> {
    const [canLike, canUnlike, canView, canModerate] = await Promise.all([
      aulaId ? this.canLikeLesson(userId, aulaId) : this.canLikeComment(userId, commentId!),
      this.canUnlike(userId, aulaId, commentId),
      this.canViewLikes(userId, aulaId, commentId),
      this.canModerate(userId),
    ]);

    return {
      canLike,
      canUnlike,
      canView,
      canModerate,
    };
  }

  /**
   * Verifica se ação é permitida e lança erro se não for
   * 
   * LSP CONTRACT:
   * - DEVE lançar erro com mensagem clara se não permitido
   * - DEVE retornar void se permitido
   * - DEVE usar métodos can* internamente
   */
  async requirePermission(
    action: 'like' | 'unlike' | 'view' | 'moderate',
    userId: string,
    aulaId?: number,
    commentId?: number
  ): Promise<void> {
    let hasPermission = false;

    switch (action) {
      case 'like':
        if (aulaId) {
          hasPermission = await this.canLikeLesson(userId, aulaId);
        } else if (commentId) {
          hasPermission = await this.canLikeComment(userId, commentId);
        } else {
          throw new Error("ID da aula ou comentário é obrigatório para dar like");
        }
        break;
      case 'unlike':
        hasPermission = await this.canUnlike(userId, aulaId, commentId);
        break;
      case 'view':
        hasPermission = await this.canViewLikes(userId, aulaId, commentId);
        break;
      case 'moderate':
        hasPermission = await this.canModerate(userId);
        break;
    }

    if (!hasPermission) {
      const content = aulaId ? `aula ${aulaId}` : `comentário ${commentId}`;
      throw new Error(`Usuário não tem permissão para ${action} em ${content}`);
    }
  }

  /**
   * Valida entrada básica para verificações de permissão
   * 
   * LSP CONTRACT:
   * - DEVE verificar se parâmetros são válidos
   * - DEVE lançar erro se parâmetros inválidos
   * - DEVE ser usado por todas as implementações
   */
  protected validatePermissionInput(userId: string, aulaId?: number, commentId?: number): void {
    if (!userId || !userId.trim()) {
      throw new Error("ID do usuário é obrigatório para verificar permissões");
    }

    if (aulaId !== undefined && (typeof aulaId !== 'number' || aulaId <= 0)) {
      throw new Error("ID da aula deve ser um número positivo");
    }

    if (commentId !== undefined && (typeof commentId !== 'number' || commentId <= 0)) {
      throw new Error("ID do comentário deve ser um número positivo");
    }

    // Deve ter pelo menos um tipo de conteúdo para a maioria das operações
    if (aulaId === undefined && commentId === undefined) {
      throw new Error("Deve especificar ID da aula ou ID do comentário");
    }
  }
}

// ============================================================================
// BASE SERVICE (LSP)
// ============================================================================

/**
 * @abstract class BaseLikeService
 * @description Classe base para serviços de likes
 * 
 * SOLID: Liskov Substitution Principle (LSP)
 * - Define contrato de serviço que todas as implementações devem seguir
 * - Garante comportamento consistente de negócio
 * - Permite diferentes implementações mantendo interface
 */
export abstract class BaseLikeService {
  protected repository: BaseLikeRepository;
  protected validator: BaseLikeValidator;
  protected permissionChecker: BaseLikePermissionChecker;

  constructor(
    repository: BaseLikeRepository,
    validator: BaseLikeValidator,
    permissionChecker: BaseLikePermissionChecker
  ) {
    this.repository = repository;
    this.validator = validator;
    this.permissionChecker = permissionChecker;
  }

  /**
   * Toggle like em aula
   * 
   * LSP CONTRACT:
   * - DEVE validar dados antes de processar
   * - DEVE verificar permissões antes de processar
   * - DEVE retornar status atual do like
   */
  abstract toggleLikeLesson(userId: string, aulaId: number): Promise<LikeResponseDto>;

  /**
   * Toggle like em comentário
   * 
   * LSP CONTRACT:
   * - DEVE validar dados antes de processar
   * - DEVE verificar permissões antes de processar
   * - DEVE retornar status atual do like
   */
  abstract toggleLikeComment(userId: string, commentId: number): Promise<LikeResponseDto>;

  /**
   * Obtém status de like do usuário
   * 
   * LSP CONTRACT:
   * - DEVE verificar permissões de visualização
   * - DEVE retornar boolean indicando se usuário deu like
   * - DEVE ser consistente com toggle methods
   */
  abstract getLikeStatus(userId: string, aulaId?: number, commentId?: number): Promise<boolean>;

  /**
   * Obtém contagem de likes
   * 
   * LSP CONTRACT:
   * - DEVE retornar número >= 0
   * - DEVE considerar apenas likes visíveis
   * - DEVE ser consistente com getStats
   */
  abstract getLikeCount(aulaId?: number, commentId?: number): Promise<number>;

  /**
   * Obtém estatísticas de likes
   * 
   * LSP CONTRACT:
   * - DEVE retornar objeto com estatísticas válidas
   * - DEVE considerar apenas likes visíveis
   * - DEVE ser consistente com getLikeCount
   */
  abstract getLikeStats(aulaId?: number, commentId?: number): Promise<LikeStatsDto>;

  /**
   * Template method para processamento comum de likes
   * 
   * LSP CONTRACT:
   * - DEVE ser usado por todas as implementações
   * - DEVE garantir consistência de processamento
   * - PODE ser estendido mas não modificado
   */
  protected async processLike(like: Like): Promise<LikeResponseDto> {
    // Processamento comum que todas as implementações devem fazer
    return {
      id: like.id,
      userId: like.userId,
      aulaId: like.aulaId ?? undefined,
      commentId: like.commentId ?? undefined,
      createdAt: like.createdAt,
      updatedAt: like.updatedAt,
    };
  }

  /**
   * Valida entrada comum para operações de like
   * 
   * LSP CONTRACT:
   * - DEVE ser chamado por todas as implementações
   * - DEVE garantir validações básicas
   * - PODE ser estendido mas não modificado
   */
  protected async validateCommonInput(userId: string, aulaId?: number, commentId?: number): Promise<void> {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error("ID do usuário é obrigatório e deve ser uma string não vazia");
    }

    // Deve ter exatamente um tipo de conteúdo
    const hasAulaId = aulaId !== undefined && aulaId !== null;
    const hasCommentId = commentId !== undefined && commentId !== null;

    if (!hasAulaId && !hasCommentId) {
      throw new Error("Deve especificar ID da aula ou ID do comentário");
    }

    if (hasAulaId && hasCommentId) {
      throw new Error("Não pode especificar ID da aula e ID do comentário ao mesmo tempo");
    }

    if (hasAulaId && (typeof aulaId !== 'number' || aulaId <= 0)) {
      throw new Error("ID da aula deve ser um número positivo");
    }

    if (hasCommentId && (typeof commentId !== 'number' || commentId <= 0)) {
      throw new Error("ID do comentário deve ser um número positivo");
    }
  }

  /**
   * Cria resposta padrão para toggle de like
   * 
   * LSP CONTRACT:
   * - DEVE retornar formato consistente
   * - DEVE incluir todas as informações necessárias
   * - DEVE ser usado por todas as implementações de toggle
   */
  protected async createToggleResponse(
    userId: string,
    aulaId?: number,
    commentId?: number,
    liked: boolean = false
  ): Promise<LikeResponseDto> {
    const likeCount = await this.repository.countByContent(aulaId, commentId);

    return {
      id: 0, // Será definido pela implementação específica
      userId,
      aulaId: aulaId || null,
      commentId: commentId || null,
      cursoId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: null,
    };
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * EXEMPLOS DE USO (LSP):
 * 
 * // 1. Todas as implementações podem ser usadas intercambiavelmente:
 * function processLikes(service: BaseLikeService) {
 *   // Funciona com qualquer implementação que estenda BaseLikeService
 *   return service.toggleLikeLesson('user123', 1);
 * }
 * 
 * // 2. Repositórios podem ser trocados sem afetar o código:
 * function setupService(repo: BaseLikeRepository) {
 *   // Funciona com PrismaLikeRepository, InMemoryLikeRepository, etc.
 *   return new LikeService(repo, validator, permissionChecker);
 * }
 * 
 * // 3. Validadores podem ter diferentes estratégias:
 * function validateLike(validator: BaseLikeValidator, data: CreateLikeDto) {
 *   // Funciona com StrictValidator, LenientValidator, etc.
 *   return validator.validateCreate(data);
 * }
 * 
 * // 4. Verificadores de permissão podem ter diferentes políticas:
 * function checkAccess(checker: BaseLikePermissionChecker, userId: string, aulaId: number) {
 *   // Funciona com RoleBasedChecker, SubscriptionChecker, etc.
 *   return checker.canLikeLesson(userId, aulaId);
 * }
 * 
 * // 5. Polimorfismo em ação:
 * const services: BaseLikeService[] = [
 *   new StandardLikeService(repo1, validator1, checker1),
 *   new PremiumLikeService(repo2, validator2, checker2),
 *   new GuestLikeService(repo3, validator3, checker3)
 * ];
 * 
 * // Todos podem ser usados da mesma forma
 * for (const service of services) {
 *   const result = await service.getLikeStats(1);
 *   console.log(result);
 * }
 */