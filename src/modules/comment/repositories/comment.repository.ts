/**
 * @fileoverview Comment Repository
 * @description Implementação do repositório para operações de comentários
 * 
 * SOLID PRINCIPLES APPLIED:
 * 
 * 1. Single Responsibility Principle (SRP):
 *    - Responsabilidade única: gerenciar persistência de comentários
 *    - Não lida com validação ou regras de negócio
 *    - Foca apenas em operações de banco de dados
 * 
 * 2. Dependency Inversion Principle (DIP):
 *    - Depende da abstração ICommentRepository
 *    - PrismaClient é injetado como dependência
 *    - Não depende de implementações concretas
 * 
 * 3. Open/Closed Principle (OCP):
 *    - Aberto para extensão através da interface
 *    - Fechado para modificação da implementação base
 * 
 * 4. Liskov Substitution Principle (LSP):
 *    - Estende BaseCommentRepository respeitando todos os contratos
 *    - Pode ser substituído por qualquer implementação da classe base
 *    - Mantém comportamento consistente definido na classe base
 */

import { PrismaClient } from "@prisma/client";
import { prisma } from '../../../shared/database/prisma.js';
import { 
  ICommentRepository, 
  CreateCommentData,
  UpdateCommentData,
  CommentWithRelations
} from '../interfaces/comment.interface.js';

/**
 * @class CommentRepository
 * @description Implementação concreta do repositório de comentários
 * 
 * SOLID: Single Responsibility Principle (SRP) + Liskov Substitution Principle (LSP)
 * - Responsabilidade única: operações de persistência de comentários
 * - Não contém lógica de negócio ou validação
 * - Respeita todos os contratos definidos na classe base
 */
export class CommentRepository implements ICommentRepository {
  /**
   * @constructor
   * @param {PrismaClient} prismaClient - Cliente Prisma injetado
   * 
   * SOLID: Dependency Inversion Principle (DIP)
   * - Recebe dependência como parâmetro ao invés de criar internamente
   * - Facilita testes unitários e diferentes configurações
   */
  constructor(private readonly prismaClient: PrismaClient = prisma) {}

  /**
   * @method create
   * @description Cria um novo comentário no banco de dados
   * @param {CreateCommentData} data - Dados do comentário
   * @returns {Promise<CommentWithRelations>} Comentário criado com relações
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Foca apenas na criação do registro no banco
   * - Não valida dados (responsabilidade do validator)
   */
  async create(data: CreateCommentData): Promise<CommentWithRelations> {
    return this.prismaClient.comment.create({
      data,
      include: this.getIncludeOptions(),
    });
  }

  /**
   * @method findById
   * @description Busca comentário por ID
   * @param {number} id - ID do comentário
   * @returns {Promise<CommentWithRelations | null>} Comentário encontrado ou null
   */
  async findById(id: number): Promise<CommentWithRelations | null> {
    return this.prismaClient.comment.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });
  }

  /**
   * @method findByLessonId
   * @description Busca comentários de uma aula específica
   * @param {number} lessonId - ID da aula
   * @returns {Promise<CommentWithRelations[]>} Lista de comentários
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade específica: buscar comentários por aula
   * - Não aplica filtros de negócio (ex: apenas comentários ativos)
   */
  async findByLessonId(lessonId: number): Promise<CommentWithRelations[]> {
    return this.prismaClient.comment.findMany({
      where: {
        aulaId: lessonId,
        parentId: null, // Apenas comentários principais (não respostas)
      },
      include: this.getIncludeOptions(),
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * @method findByCourseId
   * @description Busca comentários de um curso específico
   * @param {number} courseId - ID do curso
   * @returns {Promise<CommentWithRelations[]>} Lista de comentários
   */
  async findByCourseId(courseId: number): Promise<CommentWithRelations[]> {
    return this.prismaClient.comment.findMany({
      where: {
        cursoId: courseId,
        parentId: null,
      },
      include: this.getIncludeOptions(),
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * @method findReplies
   * @description Busca respostas de um comentário específico
   * @param {number} parentId - ID do comentário pai
   * @returns {Promise<CommentWithRelations[]>} Lista de respostas
   */
  async findReplies(parentId: number): Promise<CommentWithRelations[]> {
    return this.prismaClient.comment.findMany({
      where: { parentId },
      include: this.getIncludeOptions(),
      orderBy: {
        createdAt: "asc", // Respostas em ordem cronológica
      },
    });
  }

  /**
   * @method update
   * @description Atualiza um comentário existente
   * @param {number} id - ID do comentário
   * @param {UpdateCommentData} data - Dados para atualização
   * @returns {Promise<CommentWithRelations>} Comentário atualizado
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Foca apenas na atualização do registro
   * - Não verifica permissões (responsabilidade do service/validator)
   */
  async update(id: number, data: UpdateCommentData): Promise<CommentWithRelations> {
    return this.prismaClient.comment.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: this.getIncludeOptions(),
    });
  }

  /**
   * @method delete
   * @description Remove um comentário do banco de dados
   * @param {number} id - ID do comentário
   * @returns {Promise<void>}
   * 
   * SOLID: Single Responsibility Principle (SRP)
   * - Responsabilidade única: remoção do registro
   * - Não verifica se o usuário tem permissão (responsabilidade do service)
   */
  async delete(id: number): Promise<void> {
    await this.prismaClient.comment.delete({
      where: { id },
    });
  }

  /**
   * @method getIncludeOptions
   * @description Retorna as opções de include padrão para consultas
   * @returns {object} Opções de include do Prisma
   * 
   * SOLID: Don't Repeat Yourself (DRY) + Single Responsibility Principle (SRP)
   * - Centraliza a configuração de includes
   * - Facilita manutenção e consistência
   */
  private getIncludeOptions() {
    return {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
        },
      },
      likes: true,
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          likes: true,
        },
        orderBy: {
          createdAt: "asc" as const,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    };
  }
}