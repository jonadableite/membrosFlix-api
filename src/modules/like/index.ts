/**
 * @fileoverview Like Module Index - Simplified
 * @description Ponto de entrada simplificado para o módulo de likes
 */

// Export apenas o service simples que funciona
export { LikeSimpleService } from './services/like-simple.service.js';

// Export tipos básicos
export type {
  CreateLikeDto,
  LikeResponseDto,
  LikeStatsDto,
} from './interfaces/like.interface.js';

// Export repository básico
export { LikeRepository } from './repositories/like.repository.js';

// Export validator básico
export { LikeValidator } from './validators/like.validator.js';

// Export permission checker básico
export { LikePermissionChecker, UserRole } from './permissions/like.permission.js';

export type { UserContext } from './permissions/like.permission.js';
