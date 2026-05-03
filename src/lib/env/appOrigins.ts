/**
 * Operator / platform admin app origin when it is a separate Vite app (e.g. port 5174).
 * Empty string = same host (path-based routing or reverse proxy to the admin bundle).
 */
export function adminAppOrigin(): string {
  const raw = import.meta.env.VITE_ADMIN_APP_ORIGIN;
  return typeof raw === 'string' ? raw.trim().replace(/\/$/, '') : '';
}

export function adminAppPath(pathname: string): string {
  const o = adminAppOrigin();
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return o ? `${o}${p}` : p;
}
