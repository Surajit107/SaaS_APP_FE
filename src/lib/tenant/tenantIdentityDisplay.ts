/**
 * Primary label for the signed-in tenant user in chrome (sidebar, menus).
 * Prefer display name; fall back to email when unset.
 */
export function tenantUserPrimaryLabel(
  displayName: string | null | undefined,
  email: string | null | undefined,
  emptyFallback: string,
): string {
  const dn = displayName?.trim();
  if (dn) {
    return dn;
  }
  const em = email?.trim();
  if (em) {
    return em;
  }
  return emptyFallback;
}

export function tenantUserAvatarInitial(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const label = tenantUserPrimaryLabel(displayName, email, '');
  return label.length > 0 ? label.charAt(0).toUpperCase() : 'T';
}
