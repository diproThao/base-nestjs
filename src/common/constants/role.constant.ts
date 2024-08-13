export enum ROLE {
  ADMIN = 'admin',
  CXM = 'cxm',
  CUSTOM = 'custom',
}

export const CREATE = 'POST';
export const READ = 'GET';
export const UPDATE = ['PUT', 'PATCH'];
export const DELETE = 'DELETE';

export const ACCOUNT_DEACTIVATE = 'Account Deactivate';

export const ROLE_KEY = 'role_key';

export function getRolePermissionCacheKey(userId) {
  return `auth_role_permission_${userId}`;
}
