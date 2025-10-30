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

import { PrismaClient, Like } from "@prisma/client";
import {
  ILikeRepository,
  CreateLikeDto,
  LikeResponseDto,
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
export class LikeRepository
  extends BaseLikeRepository
  implements ILikeRepository
{
  /**
   * @constructor
   * @param {PrismaClient} prisma - Cliente Prisma injetado
   *
   * SOLID: Dependency Inversion Principle (DIP)
   * - Recebe dependência como parâmetro
   * - Permite diferentes implementações de cliente de banco
   * - Facilita testes unitários
   */
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

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

    return {
      id: like.id,
      userId: like.userId,
      commentId: like.commentId,
      aulaId: like.aulaId,
      cursoId: like.cursoId,
      createdAt: like.createdAt,
      updatedAt: like.updatedAt,
      user: like.user || null,
    };
  }

  /**
   * @method findByUser
   * @description Busca like específico do usuário
   * @param {string} userId - ID do usuário
   * @param {number} aulaId - ID da aula (opcional)
   * @param {number} commentId - ID do comentário (opcional)
   * @returns {Promise<Like | null>} Like encontrado ou null
   */
  async findByUser(
    userId: string,
    aulaId?: number,
    commentId?: number
  ): Promise<Like | null> {
    const where: any = { userId };

    if (commentId) {
      where.commentId = commentId;
    } else if (aulaId) {
      where.aulaId = aulaId;
    }

    return await this.prisma.like.findFirst({
      where,
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
  }

  /**
   * @method deleteByUser
   * @description Remove like por usuário e conteúdo
   * @param {string} userId - ID do usuário
   * @param {number} aulaId - ID da aula (opcional)
   * @param {number} commentId - ID do comentário (opcional)
   * @returns {Promise<boolean>} True se removido com sucesso
   */
  async deleteByUser(
    userId: string,
    aulaId?: number,
    commentId?: number
  ): Promise<boolean> {
    try {
      const where: any = { userId };

      if (commentId) {
        where.commentId = commentId;
      } else if (aulaId) {
        where.aulaId = aulaId;
      }

      const result = await this.prisma.like.deleteMany({ where });
      return result.count > 0;
    } catch {
      return false;
    }
  }

  /**
   * @method countByContent
   * @description Conta likes por conteúdo
   * @param {number} aulaId - ID da aula (opcional)
   * @param {number} commentId - ID do comentário (opcional)
   * @returns {Promise<number>} Número de likes
   */
  async countByContent(aulaId?: number, commentId?: number): Promise<number> {
    const where: any = {};

    if (commentId) {
      where.commentId = commentId;
    } else if (aulaId) {
      where.aulaId = aulaId;
    }

    return await this.prisma.like.count({ where });
  }

  /**
   * @method delete
   * @description Remove um like do banco de dados
   * @param {number} id - ID do like
   * @returns {Promise<void>}
   *
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: remoção de like do banco
   * - Operação atômica de exclusão
   */
  async delete(id: number): Promise<void> {
    try {
      await this.prisma.like.delete({
        where: { id },
      });
    } catch (error: any) {
      // Se o like não existir, não é um erro (idempotente)
      if (error.code !== "P2025") {
        throw error;
      }
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
   * @returns {Promise<Like | null>} Like encontrado ou null
   *
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: busca por ID
   * - Operação básica de consulta
   */
  async findById(id: number): Promise<Like | null> {
    return await this.prisma.like.findUnique({
      where: { id },
    });
  }

  /**
   * @method findByContent
   * @description Busca likes por conteúdo (aula ou comentário)
   * @param {number} aulaId - ID da aula (opcional)
   * @param {number} commentId - ID do comentário (opcional)
   * @returns {Promise<Like[]>} Array de likes encontrados
   *
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: busca por conteúdo
   * - Operação básica de consulta
   */
  async findByContent(aulaId?: number, commentId?: number): Promise<Like[]> {
    const where: any = {};

    if (aulaId) {
      where.aulaId = aulaId;
    }

    if (commentId) {
      where.commentId = commentId;
    }

    return await this.prisma.like.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }
}
