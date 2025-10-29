/**
 * @fileoverview Comment Permission Interface
 * @description Interface específica para permissões de comentários
 * 
 * SOLID PRINCIPLE: Interface Segregation Principle (ISP)
 * - Interface focada apenas em permissões
 * - Clientes que precisam apenas verificar permissões não dependem de outras operações
 * - Permite diferentes estratégias de autorização
 */

/**
 * @interface ICommentReadPermission
 * @description Interface específica para permissões de leitura
 * 
 * SOLID: ISP - Segregação de permissões de leitura
 * - Foca apenas em autorização para operações de leitura
 * - Separada de permissões de escrita
 */
export interface ICommentReadPermission {
  /**
   * @method canViewComment
   * @description Verifica se usuário pode visualizar comentário
   */
  canViewComment(userId: string, commentId: number): Promise<boolean>;

  /**
   * @method canViewCommentsByLesson
   * @description Verifica se usuário pode visualizar comentários de uma aula
   */
  canViewCommentsByLesson(userId: string, aulaId: number): Promise<boolean>;

  /**
   * @method canViewCommentsByUser
   * @description Verifica se usuário pode visualizar comentários de outro usuário
   */
  canViewCommentsByUser(requesterId: string, targetUserId: string): Promise<boolean>;

  /**
   * @method canViewPrivateComments
   * @description Verifica se usuário pode visualizar comentários privados
   */
  canViewPrivateComments(userId: string): Promise<boolean>;

  /**
   * @method canViewDeletedComments
   * @description Verifica se usuário pode visualizar comentários deletados
   */
  canViewDeletedComments(userId: string): Promise<boolean>;
}

/**
 * @interface ICommentWritePermission
 * @description Interface específica para permissões de escrita
 * 
 * SOLID: ISP - Segregação de permissões de escrita
 * - Foca apenas em autorização para operações de escrita
 * - Separada de permissões de leitura
 */
export interface ICommentWritePermission {
  /**
   * @method canCreateComment
   * @description Verifica se usuário pode criar comentário
   */
  canCreateComment(userId: string, aulaId: number): Promise<boolean>;

  /**
   * @method canReplyToComment
   * @description Verifica se usuário pode responder a comentário
   */
  canReplyToComment(userId: string, parentCommentId: number): Promise<boolean>;

  /**
   * @method canEditComment
   * @description Verifica se usuário pode editar comentário
   */
  canEditComment(userId: string, commentId: number): Promise<boolean>;

  /**
   * @method canDeleteComment
   * @description Verifica se usuário pode deletar comentário
   */
  canDeleteComment(userId: string, commentId: number): Promise<boolean>;

  /**
   * @method canRestoreComment
   * @description Verifica se usuário pode restaurar comentário deletado
   */
  canRestoreComment(userId: string, commentId: number): Promise<boolean>;
}

/**
 * @interface ICommentModerationPermission
 * @description Interface específica para permissões de moderação
 * 
 * SOLID: ISP - Segregação de permissões de moderação
 * - Foca apenas em autorização para operações de moderação
 * - Separada de permissões básicas de usuário
 */
export interface ICommentModerationPermission {
  /**
   * @method canModerateComment
   * @description Verifica se usuário pode moderar comentário
   */
  canModerateComment(userId: string, commentId: number): Promise<boolean>;

  /**
   * @method canHideComment
   * @description Verifica se usuário pode ocultar comentário
   */
  canHideComment(userId: string, commentId: number): Promise<boolean>;

  /**
   * @method canPinComment
   * @description Verifica se usuário pode fixar comentário
   */
  canPinComment(userId: string, commentId: number): Promise<boolean>;

  /**
   * @method canFeatureComment
   * @description Verifica se usuário pode destacar comentário
   */
  canFeatureComment(userId: string, commentId: number): Promise<boolean>;

  /**
   * @method canBanUser
   * @description Verifica se usuário pode banir outro usuário
   */
  canBanUser(moderatorId: string, targetUserId: string): Promise<boolean>;

  /**
   * @method canViewModerationLog
   * @description Verifica se usuário pode visualizar log de moderação
   */
  canViewModerationLog(userId: string): Promise<boolean>;
}

/**
 * @interface ICommentAdminPermission
 * @description Interface específica para permissões administrativas
 * 
 * SOLID: ISP - Segregação de permissões administrativas
 * - Foca apenas em operações administrativas
 * - Separada de permissões de usuário comum
 */
export interface ICommentAdminPermission {
  /**
   * @method canDeleteAnyComment
   * @description Verifica se usuário pode deletar qualquer comentário
   */
  canDeleteAnyComment(userId: string): Promise<boolean>;

  /**
   * @method canEditAnyComment
   * @description Verifica se usuário pode editar qualquer comentário
   */
  canEditAnyComment(userId: string): Promise<boolean>;

  /**
   * @method canViewAllComments
   * @description Verifica se usuário pode visualizar todos os comentários
   */
  canViewAllComments(userId: string): Promise<boolean>;

  /**
   * @method canManageCommentSettings
   * @description Verifica se usuário pode gerenciar configurações de comentários
   */
  canManageCommentSettings(userId: string): Promise<boolean>;

  /**
   * @method canExportComments
   * @description Verifica se usuário pode exportar comentários
   */
  canExportComments(userId: string): Promise<boolean>;

  /**
   * @method canBulkOperations
   * @description Verifica se usuário pode realizar operações em lote
   */
  canBulkOperations(userId: string): Promise<boolean>;
}

/**
 * @interface ICommentOwnershipPermission
 * @description Interface específica para permissões de propriedade
 * 
 * SOLID: ISP - Segregação de permissões de propriedade
 * - Foca apenas em verificações de propriedade
 * - Permite diferentes estratégias de ownership
 */
export interface ICommentOwnershipPermission {
  /**
   * @method isCommentOwner
   * @description Verifica se usuário é dono do comentário
   */
  isCommentOwner(userId: string, commentId: number): Promise<boolean>;

  /**
   * @method isLessonOwner
   * @description Verifica se usuário é dono da aula
   */
  isLessonOwner(userId: string, aulaId: number): Promise<boolean>;

  /**
   * @method canTransferOwnership
   * @description Verifica se usuário pode transferir propriedade
   */
  canTransferOwnership(currentOwnerId: string, newOwnerId: string, commentId: number): Promise<boolean>;

  /**
   * @method canDelegatePermissions
   * @description Verifica se usuário pode delegar permissões
   */
  canDelegatePermissions(userId: string, targetUserId: string): Promise<boolean>;
}

/**
 * @interface ICommentRolePermission
 * @description Interface específica para permissões baseadas em roles
 * 
 * SOLID: ISP - Segregação de permissões por role
 * - Foca apenas em verificações baseadas em papéis
 * - Permite diferentes estratégias de role-based access
 */
export interface ICommentRolePermission {
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
}

/**
 * @interface ICommentPermissionComposer
 * @description Interface para composição de permissões
 * 
 * SOLID: ISP - Interface para orquestração de permissões
 * - Permite combinar diferentes tipos de permissão
 * - Mantém flexibilidade na escolha de verificadores
 */
export interface ICommentPermissionComposer {
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
  addPermissionChecker(checker: ICommentReadPermission | ICommentWritePermission | ICommentModerationPermission | ICommentAdminPermission | ICommentOwnershipPermission | ICommentRolePermission): void;

  /**
   * @method setPermissionStrategy
   * @description Define estratégia de permissão (strict, normal, permissive)
   */
  setPermissionStrategy(strategy: 'strict' | 'normal' | 'permissive'): void;
}