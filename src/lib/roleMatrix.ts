/**
 * 角色權限矩陣
 * 從 permissions.ts 導出，保持向後兼容
 */
export { ROLE_MATRIX, PERMISSIONS, hasPermission, hasAnyPermission, hasAllPermissions, getRolePermissions } from './permissions';
export type { RoleType, Permission } from './permissions';

