/**
 * @fileoverview Comment Module Interfaces
 * @description Implementação do Interface Segregation Principle (ISP)
 * 
 * SOLID PRINCIPLE: Interface Segregation Principle (ISP)
 * - Interfaces específicas e coesas para cada responsabilidade
 * - Evita interfaces "gordas" com métodos não utilizados
 * - Cada cliente depende apenas das interfaces que realmente usa
 */

import type { Comment, User, Like } from "@prisma/client";

/**
 * @interface ICommentRepository
 * @description Interface específica para operações de persistência de comentários
 * 
 * SOLID: ISP - Interface focada apenas em operações de dados
 * Clientes que precisam apenas de persistência não são forçados a depender de validação
 */
export interface ICommentRepository {
  create(data: CreateCommentData): Promise<CommentWithRelations>;
  findById(id: number): Promise<CommentWithRelations | null>;
  findByLessonId(lessonId: number): Promise<CommentWithRelations[]>;
  findByCourseId(courseId: number): Promise<CommentWithRelations[]>;
  update(id: number, data: UpdateCommentData): Promise<CommentWithRelations>;
  delete(id: number): Promise<void>;
  findReplies(parentId: number): Promise<CommentWithRelations[]>;
}

/**
 * @interface ICommentValidator
 * @description Interface específica para validação de comentários
 * 
 * SOLID: ISP - Interface focada apenas em validação
 * Separada da persistência para permitir diferentes implementações de validação
 */
export interface ICommentValidator {
  validateCreateData(data: CreateCommentDto): Promise<void>;
  validateUpdateData(data: UpdateCommentDto): Promise<void>;
  validateOwnership(commentId: number, userId: string): Promise<void>;
  validateParentExists(parentId: number): Promise<void>;
}

/**
 * @interface ICommentPermissionChecker
 * @description Interface específica para verificação de permissões
 * 
 * SOLID: ISP - Interface focada apenas em permissões
 * Permite diferentes estratégias de autorização sem afetar outras responsabilidades
 */
export interface ICommentPermissionChecker {
  canEdit(commentId: number, userId: string): Promise<boolean>;
  canDelete(commentId: number, userId: string): Promise<boolean>;
  canReply(parentId: number, userId: string): Promise<boolean>;
}

/**
 * @interface ICommentService
 * @description Interface principal do serviço de comentários
 * 
 * SOLID: ISP - Interface focada na lógica de negócio
 * Não expõe detalhes de implementação de persistência ou validação
 */
export interface ICommentService {
  createComment(data: CreateCommentDto): Promise<CommentResponseDto>;
  getCommentsByLesson(lessonId: number, userId?: string): Promise<CommentResponseDto[]>;
  getCommentsByCourse(courseId: number, userId?: string): Promise<CommentResponseDto[]>;
  updateComment(commentId: number, userId: string, content: string): Promise<CommentResponseDto>;
  deleteComment(commentId: number, userId: string): Promise<void>;
  getReplies(parentId: number, userId?: string): Promise<CommentResponseDto[]>;
}

// DTOs e Types
export interface CreateCommentDto {
  content: string;
  userId: string;
  aulaId?: number;
  cursoId?: number;
  parentId?: number;
}

export interface UpdateCommentDto {
  content: string;
}

export interface CommentFilterDto {
  userId?: string;
  aulaId?: number;
  cursoId?: number;
  parentId?: number;
  content?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface CreateCommentData {
  content: string;
  userId: string;
  aulaId?: number | null;
  cursoId?: number | null;
  parentId?: number | null;
}

export interface UpdateCommentData {
  content: string;
  updatedAt?: Date;
}

export interface CommentWithRelations extends Comment {
  user: Pick<User, 'id' | 'name' | 'email' | 'profilePicture'>;
  likes: Like[];
  replies?: CommentWithRelations[];
  _count?: {
    likes: number;
    replies: number;
  };
}

export interface CommentResponseDto {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  aulaId?: number | null;
  cursoId?: number | null;
  parentId?: number | null;
  user: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string | null;
  };
  likesCount: number;
  repliesCount: number;
  userLiked?: boolean;
  replies?: CommentResponseDto[];
}