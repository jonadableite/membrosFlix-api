/**
 * @fileoverview Like Module Index - Simplified
 * @description Ponto de entrada simplificado para o módulo de likes
 */

// Export apenas o service simples que funciona
export { LikeSimpleService } from "./services/like-simple.service";

// Export tipos básicos
export type {
  CreateLikeDto,
  LikeResponseDto,
  LikeStatsDto,
} from "./interfaces/like.interface";

// Export repository básico
export { LikeRepository } from "./repositories/like.repository";

// Export validator básico
export { LikeValidator } from "./validators/like.validator";

// Export permission checker básico
export { LikePermissionChecker, UserRole } from "./permissions/like.permission";

export type { UserContext } from "./permissions/like.permission";
