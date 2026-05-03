/**
 * Default landing route after tenant auth for the given org role.
 */
export function tenantAuthenticatedHomePath(
  tenantRole: 'admin' | 'member' | null,
): '/tenant/workspaces' | '/tenant/user/dashboard' {
  return tenantRole === 'member' ? '/tenant/user/dashboard' : '/tenant/workspaces';
}
