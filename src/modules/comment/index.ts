/**
 * @fileoverview Comment Module Index - Simplified
 * @description Ponto de entrada simplificado para o módulo de comentários
 */

// Export apenas o service simples que funciona
export { CommentSimpleService } from "./services/comment-simple.service";

// Export tipos básicos
export type {
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
} from "./interfaces/comment.interface";

// Export repository básico
export { CommentRepository } from "./repositories/comment.repository";

// Export validator básico
export { CommentValidator } from "./validators/comment.validator";

// Export permission checker básico
export { CommentPermissionChecker } from "./permissions/comment.permission";
