const STORAGE_KEY = 'saas:postLogoutTenantLogin';

/** Where to send the user after tenant portal session ends (explicit logout uses `/`). */
export type TenantPortalLoginPath = '/' | '/tenant/login' | '/tenant/user/login';

export function setPostLogoutTenantLoginPath(path: TenantPortalLoginPath): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    /* quota / private mode */
  }
}

/** Clears any pending redirect target (e.g. after a fresh sign-in). */
export function clearPostLogoutTenantLoginPath(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Returns the redirect path set at tenant logout, then removes it so it applies once.
 */
export function consumePostLogoutTenantLoginPath(): TenantPortalLoginPath | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (raw === '/' || raw === '/tenant/user/login' || raw === '/tenant/login') {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return null;
}
