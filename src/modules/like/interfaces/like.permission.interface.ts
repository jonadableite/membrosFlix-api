/**
 * @fileoverview Like Permission Interface
 * @description Interface específica para permissões de likes
 * 
 * SOLID PRINCIPLE: Interface Segregation Principle (ISP)
 * - Interface focada apenas em permissões
 * - Clientes que precisam apenas verificar permissões não dependem de outras operações
 * - Permite diferentes estratégias de autorização
 */

/**
 * @interface ILikeReadPermission
 * @description Interface específica para permissões de leitura de likes
 * 
 * SOLID: ISP - Segregação de permissões de leitura
 * - Foca apenas em autorização para operações de leitura
 * - Separada de permissões de escrita
 */
export interface ILikeReadPermission {
  /**
   * @method canViewLike
   * @description Verifica se usuário pode visualizar like específico
   */
  canViewLike(userId: string, likeId: number): Promise<boolean>;

  /**
   * @method canViewLikesByComment
   * @description Verifica se usuário pode visualizar likes de um comentário
   */
  canViewLikesByComment(userId: string, commentId: number): Promise<boolean>;

  /**
   * @method canViewLikesByLesson
   * @description Verifica se usuário pode visualizar likes de uma aula
   */
  canViewLikesByLesson(userId: string, aulaId: number): Promise<boolean>;

  /**
   * @method canViewLikesByUser
   * @description Verifica se usuário pode visualizar likes de outro usuário
   */
  canViewLikesByUser(requesterId: string, targetUserId: string): Promise<boolean>;

  /**
   * @method canViewLikeStats
   * @description Verifica se usuário pode visualizar estatísticas de likes
   */
  canViewLikeStats(userId: string, resourceId?: number): Promise<boolean>;

  /**
   * @method canViewLikeHistory
   * @description Verifica se usuário pode visualizar histórico de likes
   */
  canViewLikeHistory(userId: string, targetUserId?: string): Promise<boolean>;
}

/**
 * @interface ILikeWritePermission
 * @description Interface específica para permissões de escrita de likes
 * 
 * SOLID: ISP - Segregação de permissões de escrita
 * - Foca apenas em autorização para operações de escrita
 * - Separada de permissões de leitura
 */
export interface ILikeWritePermission {
  /**
   * @method canLikeComment
   * @description Verifica se usuário pode curtir comentário
   */
  canLikeComment(userId: string, commentId: number): Promise<boolean>;

  /**
   * @method canLikeLesson
   * @description Verifica se usuário pode curtir aula
   */
  canLikeLesson(userId: string, aulaId: number): Promise<boolean>;

  /**
   * @method canUnlike
   * @description Verifica se usuário pode descurtir
   */
  canUnlike(userId: string, likeId: number): Promise<boolean>;

  /**
   * @method canToggleLike
   * @description Verifica se usuário pode alternar like
   */
  canToggleLike(userId: string, commentId?: number, aulaId?: number): Promise<boolean>;

  /**
   * @method canBulkLike
   * @description Verifica se usuário pode curtir em lote
   */
  canBulkLike(userId: string, resourceIds: number[]): Promise<boolean>;
}

/**
 * @interface ILikeOwnershipPermission
 * @description Interface específica para permissões de propriedade de likes
 * 
 * SOLID: ISP - Segregação de permissões de propriedade
 * - Foca apenas em verificações de propriedade
 * - Permite diferentes estratégias de ownership
 */
export interface ILikeOwnershipPermission {
  /**
   * @method isLikeOwner
   * @description Verifica se usuário é dono do like
   */
  isLikeOwner(userId: string, likeId: number): Promise<boolean>;

  /**
   * @method isContentOwner
   * @description Verifica se usuário é dono do conteúdo curtido
   */
  isContentOwner(userId: string, commentId?: number, aulaId?: number): Promise<boolean>;

  /**
   * @method canManageOwnLikes
   * @description Verifica se usuário pode gerenciar próprios likes
   */
  canManageOwnLikes(userId: string): Promise<boolean>;

  /**
   * @method canViewOwnLikeHistory
   * @description Verifica se usuário pode visualizar próprio histórico
   */
  canViewOwnLikeHistory(userId: string): Promise<boolean>;
}

/**
 * @interface ILikeContentPermission
 * @description Interface específica para permissões baseadas no conteúdo
 * 
 * SOLID: ISP - Segregação de permissões por conteúdo
 * - Foca apenas em verificações baseadas no tipo de conteúdo
 * - Permite diferentes regras por tipo de recurso
 */
export interface ILikeContentPermission {
  /**
   * @method canAccessComment
   * @description Verifica se usuário tem acesso ao comentário
   */
  canAccessComment(userId: string, commentId: number): Promise<boolean>;

  /**
   * @method canAccessLesson
   * @description Verifica se usuário tem acesso à aula
   */
  canAccessLesson(userId: string, aulaId: number): Promise<boolean>;

  /**
   * @method isCommentPublic
   * @description Verifica se comentário é público
   */
  isCommentPublic(commentId: number): Promise<boolean>;

  /**
   * @method isLessonPublic
   * @description Verifica se aula é pública
   */
  isLessonPublic(aulaId: number): Promise<boolean>;

  /**
   * @method isContentActive
   * @description Verifica se conteúdo está ativo
   */
  isContentActive(commentId?: number, aulaId?: number): Promise<boolean>;

  /**
   * @method hasContentSubscription
   * @description Verifica se usuário tem assinatura para o conteúdo
   */
  hasContentSubscription(userId: string, aulaId?: number): Promise<boolean>;
}

/**
 * @interface ILikeRateLimitPermission
 * @description Interface específica para permissões de rate limiting
 * 
 * SOLID: ISP - Segregação de permissões de rate limiting
 * - Foca apenas em verificações de limite de taxa
 * - Permite diferentes estratégias de controle
 */
export interface ILikeRateLimitPermission {
  /**
   * @method canLikeWithinRateLimit
   * @description Verifica se usuário pode curtir dentro do limite
   */
  canLikeWithinRateLimit(userId: string): Promise<boolean>;

  /**
   * @method hasExceededDailyLimit
   * @description Verifica se excedeu limite diário
   */
  hasExceededDailyLimit(userId: string): Promise<boolean>;

  /**
   * @method hasExceededHourlyLimit
   * @description Verifica se excedeu limite por hora
   */
  hasExceededHourlyLimit(userId: string): Promise<boolean>;

  /**
   * @method canBypassRateLimit
   * @description Verifica se usuário pode ignorar rate limit
   */
  canBypassRateLimit(userId: string): Promise<boolean>;

  /**
   * @method getRemainingLikes
   * @description Obtém quantidade restante de likes
   */
  getRemainingLikes(userId: string): Promise<number>;

  /**
   * @method getResetTime
   * @description Obtém tempo para reset do limite
   */
  getResetTime(userId: string): Promise<Date>;
}

/**
 * @interface ILikeAdminPermission
 * @description Interface específica para permissões administrativas
 * 
 * SOLID: ISP - Segregação de permissões administrativas
 * - Foca apenas em operações administrativas
 * - Separada de permissões de usuário comum
 */
export interface ILikeAdminPermission {
  /**
   * @method canViewAllLikes
   * @description Verifica se usuário pode visualizar todos os likes
   */
  canViewAllLikes(userId: string): Promise<boolean>;

  /**
   * @method canDeleteAnyLike
   * @description Verifica se usuário pode deletar qualquer like
   */
  canDeleteAnyLike(userId: string): Promise<boolean>;

  /**
   * @method canManageLikeSettings
   * @description Verifica se usuário pode gerenciar configurações
   */
  canManageLikeSettings(userId: string): Promise<boolean>;

  /**
   * @method canViewLikeAnalytics
   * @description Verifica se usuário pode visualizar analytics
   */
  canViewLikeAnalytics(userId: string): Promise<boolean>;

  /**
   * @method canExportLikeData
   * @description Verifica se usuário pode exportar dados
   */
  canExportLikeData(userId: string): Promise<boolean>;

  /**
   * @method canBulkOperations
   * @description Verifica se usuário pode realizar operações em lote
   */
  canBulkOperations(userId: string): Promise<boolean>;
}

/**
 * @interface ILikeRolePermission
 * @description Interface específica para permissões baseadas em roles
 * 
 * SOLID: ISP - Segregação de permissões por role
 * - Foca apenas em verificações baseadas em papéis
 * - Permite diferentes estratégias de role-based access
 */
export interface ILikeRolePermission {
  /**
   * @method hasRole
   * @description Verifica se usuário tem role específico
   */
  hasRole(userId: string, role: string): Promise<boolean>;

  /**
   * @method hasAnyRole
   * @description Verifica se usuário tem qualquer um dos roles
   */
  hasAnyRole(userId: string, roles: string[]): Promise<boolean>;

  /**
   * @method hasAllRoles
   * @description Verifica se usuário tem todos os roles
   */
  hasAllRoles(userId: string, roles: string[]): Promise<boolean>;

  /**
   * @method canAssignRole
   * @description Verifica se usuário pode atribuir role
   */
  canAssignRole(assignerId: string, targetUserId: string, role: string): Promise<boolean>;

  /**
   * @method getRoleHierarchy
   * @description Obtém hierarquia de roles do usuário
   */
  getRoleHierarchy(userId: string): Promise<string[]>;

  /**
   * @method hasMinimumRole
   * @description Verifica se usuário tem role mínimo necessário
   */
  hasMinimumRole(userId: string, minimumRole: string): Promise<boolean>;
}

/**
 * @interface ILikePermissionComposer
 * @description Interface para composição de permissões
 * 
 * SOLID: ISP - Interface para orquestração de permissões
 * - Permite combinar diferentes tipos de permissão
 * - Mantém flexibilidade na escolha de verificadores
 */
export interface ILikePermissionComposer {
  /**
   * @method checkPermission
   * @description Verifica permissão específica
   */
  checkPermission(userId: string, permission: string, resourceId?: number): Promise<boolean>;

  /**
   * @method checkMultiplePermissions
   * @description Verifica múltiplas permissões
   */
  checkMultiplePermissions(userId: string, permissions: string[], resourceId?: number): Promise<Record<string, boolean>>;

  /**
   * @method requirePermission
   * @description Exige permissão específica (lança erro se não tiver)
   */
  requirePermission(userId: string, permission: string, resourceId?: number): Promise<void>;

  /**
   * @method addPermissionChecker
   * @description Adiciona verificador de permissão
   */
  addPermissionChecker(checker: ILikeReadPermission | ILikeWritePermission | ILikeOwnershipPermission | ILikeContentPermission | ILikeRateLimitPermission | ILikeAdminPermission | ILikeRolePermission): void;

  /**
   * @method setPermissionStrategy
   * @description Define estratégia de permissão (strict, normal, permissive)
   */
  setPermissionStrategy(strategy: 'strict' | 'normal' | 'permissive'): void;

  /**
   * @method evaluateComplexPermission
   * @description Avalia permissão complexa com múltiplas condições
   */
  evaluateComplexPermission(userId: string, conditions: Record<string, any>): Promise<boolean>;
}