/**
 * @fileoverview Like Repository
 * @description Implementação do repositório para operações de likes
 * 
 * SOLID PRINCIPLES APPLIED:
 * 
 * 1. Single Responsibility Principle (SRP):
 *    - Responsabilidade única: gerenciar persistência de likes
 *    - Não lida com validação ou regras de negócio
 *    - Foca apenas em operações de banco de dados
 * 
 * 2. Dependency Inversion Principle (DIP):
 *    - Depende da abstração ILikeRepository
 *    - PrismaClient é injetado como dependência
 *    - Não depende de implementações concretas
 * 
 * 3. Open/Closed Principle (OCP):
 *    - Aberto para extensão através da interface
 *    - Fechado para modificação da implementação base
 * 
 * 4. Liskov Substitution Principle (LSP):
 *    - Estende BaseLikeRepository respeitando todos os contratos
 *    - Pode ser substituído por qualquer implementação da classe base
 *    - Mantém comportamento consistente definido na classe base
 */

import { Like, PrismaClient } from "@prisma/client";
import { 
  ILikeRepository, 
  CreateLikeDto,
  LikeResponseDto
} from "../interfaces/like.interface";
import { BaseLikeRepository } from "../abstractions/like.base";

/**
 * @class LikeRepository
 * @description Implementação concreta do repositório de likes
 * 
 * SOLID: Single Responsibility Principle (SRP) + Liskov Substitution Principle (LSP)
 * - Responsabilidade única: operações de persistência de likes
 * - Não contém lógica de negócio ou validação
 * - Respeita todos os contratos definidos na classe base
 */
export class LikeRepository extends BaseLikeRepository implements ILikeRepository {
  /**
   * @constructor
   * @param {PrismaClient} prisma - Cliente Prisma injetado
   * 
   * SOLID: Dependency Inversion Principle (DIP)
   * - Recebe dependência como parâmetro
   * - Permite diferentes implementações de cliente de banco
   * - Facilita testes unitários
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * @method create
   * @description Cria um novo like no banco de dados
   * @param {CreateLikeDto} data - Dados do like
   * @returns {Promise<LikeResponseDto>} Like criado
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: criação de like no banco
   * - Inclui dados relacionados necessários (user)
   * - Não contém validação ou lógica de negócio
   */
  async create(data: CreateLikeDto): Promise<LikeResponseDto> {
    const like = await this.prisma.like.create({
      data: {
        userId: data.userId,
        commentId: data.commentId || null,
        aulaId: data.aulaId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.mapToResponseDto(like);
  }

  /**
   * @method findByUserAndComment
   * @description Busca like por usuário e comentário
   * @param {string} userId - ID do usuário
   * @param {number} commentId - ID do comentário
   * @returns {Promise<LikeResponseDto | null>} Like encontrado ou null
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: busca de like por critérios específicos
   * - Operação atômica de consulta
   */
  async findByUserAndComment(userId: string, commentId: number): Promise<LikeResponseDto | null> {
    const like = await this.prisma.like.findFirst({
      where: {
        userId,
        commentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return like ? this.mapToResponseDto(like) : null;
  }

  /**
   * @method findByUserAndLesson
   * @description Busca like por usuário e aula
   * @param {string} userId - ID do usuário
   * @param {number} aulaId - ID da aula
   * @returns {Promise<LikeResponseDto | null>} Like encontrado ou null
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: busca de like por critérios específicos
   * - Operação atômica de consulta
   */
  async findByUserAndLesson(userId: string, aulaId: number): Promise<LikeResponseDto | null> {
    const like = await this.prisma.like.findFirst({
      where: {
        userId,
        aulaId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return like ? this.mapToResponseDto(like) : null;
  }

  /**
   * @method delete
   * @description Remove um like do banco de dados
   * @param {number} id - ID do like
   * @returns {Promise<boolean>} True se removido com sucesso
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: remoção de like do banco
   * - Operação atômica de exclusão
   */
  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.like.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method countByComment
   * @description Conta likes de um comentário
   * @param {number} commentId - ID do comentário
   * @returns {Promise<number>} Número de likes
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: contagem de likes por comentário
   * - Operação otimizada de agregação
   */
  async countByComment(commentId: number): Promise<number> {
    return await this.prisma.like.count({
      where: {
        commentId,
      },
    });
  }

  /**
   * @method countByLesson
   * @description Conta likes de uma aula
   * @param {number} aulaId - ID da aula
   * @returns {Promise<number>} Número de likes
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: contagem de likes por aula
   * - Operação otimizada de agregação
   */
  async countByLesson(aulaId: number): Promise<number> {
    return await this.prisma.like.count({
      where: {
        aulaId,
      },
    });
  }

  /**
   * @method findById
   * @description Busca like por ID
   * @param {number} id - ID do like
   * @returns {Promise<LikeResponseDto | null>} Like encontrado ou null
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: busca de like por ID
   * - Operação básica de consulta
   */
  async findById(id: number): Promise<LikeResponseDto | null> {
    const like = await this.prisma.like.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return like ? this.mapToResponseDto(like) : null;
  }

  /**
   * @method mapToResponseDto
   * @description Mapeia dados do Prisma para DTO de resposta
   * @param {any} like - Dados do like do Prisma
   * @returns {LikeResponseDto} DTO formatado
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: transformação de dados
   * - Centraliza mapeamento de dados do banco para DTO
   * 
   * SOLID: Open/Closed Principle (OCP)
   * - Aberto para extensão: novos campos podem ser adicionados
   * - Fechado para modificação: mapeamento existente não muda
   */
  private mapToResponseDto(like: any): LikeResponseDto {
    return {
      id: like.id,
      userId: like.userId,
      commentId: like.commentId ?? undefined,
      aulaId: like.aulaId ?? undefined,
      createdAt: like.createdAt,
      user: like.user ? {
        id: like.user.id,
        name: like.user.name,
        email: like.user.email,
      } : undefined,
    };
  }
}