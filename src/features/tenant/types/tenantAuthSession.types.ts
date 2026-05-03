import type { AuthSessionUser } from '@/lib/api/types';

/**
 * Payload for `loginSucceeded` — must stay in lockstep with `AuthSessionUser`
 * from `/auth/login` and `/auth/me` (tenant-scoped users only).
 */
export type TenantLoginSuccessPayload = Pick<
  AuthSessionUser,
  'id' | 'email' | 'tenantId' | 'tenantRole' | 'displayName'
> & {
  organizationName?: string;
};
