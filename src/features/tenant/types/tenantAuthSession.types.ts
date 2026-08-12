import type { AuthSessionUser, MfaChallengeMethod } from '@/lib/api/types';

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

/**
 * A first factor that passed, waiting on a second. Held in memory only — the
 * challenge token is a credential and expires in minutes.
 */
export interface TenantMfaChallenge {
  challengeToken: string;
  methods: MfaChallengeMethod[];
  /** ISO timestamp; after this the user has to start from the password again. */
  expiresAt: string;
  /** Echoed back for display, so the second step can name the account. */
  email: string;
}
