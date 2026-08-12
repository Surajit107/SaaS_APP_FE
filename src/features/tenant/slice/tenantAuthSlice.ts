import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  loadTenantSession,
  persistTenantSession,
} from '@/lib/auth/portalSession';
import type { TenantProfile } from '@/lib/api/Api';

import type {
  TenantLoginSuccessPayload,
  TenantMfaChallenge,
} from '@/features/tenant/types/tenantAuthSession.types';

export interface TenantAuthState {
  isAuthenticated: boolean;
  email: string | null;
  organizationName: string | null;
  /** From JWT user (`/auth/login`, `/auth/me`); null when logged out. */
  tenantId: string | null;
  /** From JWT user; null when absent (e.g. legacy token) or logged out. */
  tenantRole: 'admin' | 'member' | null;
  /** From `/auth/login` and `/auth/me`; null when logged out or not yet synced. */
  userId: string | null;
  /** User document display name; updated from session and PATCH /tenant/me. */
  displayName: string | null;
  isDisplayNameSaving: boolean;
  displayNameSaveError: string | null;
  isLoading: boolean;
  error: string | null;
  /** Set after successful register; consumer navigates to login and clears. */
  postRegisterLoginHint: string | null;
  /** Password accepted, second factor outstanding; null when no login is mid-flight. */
  mfaChallenge: TenantMfaChallenge | null;
  isMfaVerifying: boolean;
  /** Errors from the second step only — kept apart from the password form's `error`. */
  mfaError: string | null;
  /** POST /auth/login/email-code in flight. */
  isLoginCodeRequestPending: boolean;
  tenantProfile: TenantProfile | null;
  isTenantProfileLoading: boolean;
  tenantProfileError: string | null;
  isTenantUpdateLoading: boolean;
  tenantUpdateError: string | null;
  /** POST /tenant/users/accept-invite — isolated from login/register `isLoading` / `error`. */
  acceptInviteLoading: boolean;
  acceptInviteError: string | null;
  acceptInviteSucceeded: boolean;
  /** POST /auth/logout in flight — isolated from login/register `isLoading`. */
  isLogoutPending: boolean;
}

const hydrated = loadTenantSession();
const initialState: TenantAuthState = {
  isAuthenticated: hydrated.isAuthenticated,
  email: hydrated.email,
  organizationName: hydrated.organizationName,
  tenantId: null,
  tenantRole: null,
  userId: null,
  displayName: null,
  isDisplayNameSaving: false,
  displayNameSaveError: null,
  isLoading: false,
  error: null,
  postRegisterLoginHint: null,
  mfaChallenge: null,
  isMfaVerifying: false,
  mfaError: null,
  isLoginCodeRequestPending: false,
  tenantProfile: null,
  isTenantProfileLoading: false,
  tenantProfileError: null,
  isTenantUpdateLoading: false,
  tenantUpdateError: null,
  acceptInviteLoading: false,
  acceptInviteError: null,
  acceptInviteSucceeded: false,
  isLogoutPending: false,
};

export const tenantAuthSlice = createSlice({
  name: 'tenantAuth',
  initialState,
  reducers: {
    clearError: (state): void => {
      state.error = null;
    },
    tenantProfileRequested: (state): void => {
      state.isTenantProfileLoading = true;
      state.tenantProfileError = null;
    },
    tenantProfileSucceeded: (
      state,
      action: PayloadAction<TenantProfile>,
    ): void => {
      state.isTenantProfileLoading = false;
      state.tenantProfileError = null;
      state.tenantProfile = action.payload;
      state.organizationName = action.payload.name;
      persistTenantSession({
        isAuthenticated: state.isAuthenticated,
        email: state.email,
        organizationName: state.organizationName,
      });
    },
    tenantProfileFailed: (state, action: PayloadAction<string>): void => {
      state.isTenantProfileLoading = false;
      state.tenantProfileError = action.payload;
    },
    loginRequested: (state): void => {
      state.isLoading = true;
      state.error = null;
      state.mfaChallenge = null;
      state.isMfaVerifying = false;
      state.mfaError = null;
    },
    /** `/auth/login` accepted the password but wants a second factor. */
    mfaChallengeIssued: (
      state,
      action: PayloadAction<TenantMfaChallenge>,
    ): void => {
      state.isLoading = false;
      state.error = null;
      state.mfaChallenge = action.payload;
      state.isMfaVerifying = false;
      state.mfaError = null;
      state.isLoginCodeRequestPending = false;
    },
    loginCodeRequestStarted: (state): void => {
      state.isLoginCodeRequestPending = true;
      state.error = null;
    },
    loginCodeRequestFailed: (state, action: PayloadAction<string>): void => {
      state.isLoginCodeRequestPending = false;
      state.error = action.payload;
    },
    mfaVerifyStarted: (state): void => {
      state.isMfaVerifying = true;
      state.mfaError = null;
    },
    mfaVerifyFailed: (state, action: PayloadAction<string>): void => {
      state.isMfaVerifying = false;
      state.mfaError = action.payload;
    },
    /** Abandons the pending challenge and returns the user to the password form. */
    mfaChallengeAbandoned: (state): void => {
      state.mfaChallenge = null;
      state.isMfaVerifying = false;
      state.mfaError = null;
      state.isLoginCodeRequestPending = false;
    },
    clearMfaError: (state): void => {
      state.mfaError = null;
    },
    loginSucceeded: (
      state,
      action: PayloadAction<TenantLoginSuccessPayload>,
    ): void => {
      state.isAuthenticated = true;
      state.email = action.payload.email;
      state.tenantId =
        typeof action.payload.tenantId === 'string' &&
        action.payload.tenantId.length > 0
          ? action.payload.tenantId
          : null;
      state.tenantRole =
        action.payload.tenantRole === 'admin' ||
        action.payload.tenantRole === 'member'
          ? action.payload.tenantRole
          : null;
      state.userId =
        typeof action.payload.id === 'string' && action.payload.id.length > 0
          ? action.payload.id
          : null;
      state.isLoading = false;
      state.error = null;
      state.postRegisterLoginHint = null;
      state.mfaChallenge = null;
      state.isMfaVerifying = false;
      state.mfaError = null;
      if (action.payload.organizationName !== undefined) {
        state.organizationName = action.payload.organizationName;
      }
      {
        const raw = action.payload.displayName;
        state.displayName =
          typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null;
      }
      persistTenantSession({
        isAuthenticated: true,
        email: state.email,
        organizationName: state.organizationName,
      });
    },
    loginFailed: (state, action: PayloadAction<string>): void => {
      state.isLoading = false;
      state.error = action.payload;
    },
    registerRequested: (state): void => {
      state.isLoading = true;
      state.error = null;
    },
    registerSucceeded: (
      state,
      action: PayloadAction<{ email: string }>,
    ): void => {
      state.isLoading = false;
      state.error = null;
      state.postRegisterLoginHint = action.payload.email;
    },
    clearPostRegisterLoginHint: (state): void => {
      state.postRegisterLoginHint = null;
    },
    registerFailed: (state, action: PayloadAction<string>): void => {
      state.isLoading = false;
      state.error = action.payload;
    },
    /**
     * Fired by the same action as `tenantAcceptInviteRequested` (shared `tenantAuth/acceptInviteRequested` type).
     * Never dispatch this from the saga — that would re-enter the saga and freeze the app.
     */
    acceptInviteRequested: (state): void => {
      state.acceptInviteLoading = true;
      state.acceptInviteError = null;
    },
    acceptInviteSucceeded: (state): void => {
      state.acceptInviteLoading = false;
      state.acceptInviteError = null;
      state.acceptInviteSucceeded = true;
    },
    acceptInviteFailed: (state, action: PayloadAction<string>): void => {
      state.acceptInviteLoading = false;
      state.acceptInviteError = action.payload;
    },
    clearAcceptInviteError: (state): void => {
      state.acceptInviteError = null;
    },
    /** Call when entering `/accept-invite` so a prior saga result does not leak across visits. */
    resetAcceptInviteUiState: (state): void => {
      state.acceptInviteLoading = false;
      state.acceptInviteError = null;
      state.acceptInviteSucceeded = false;
    },
    logoutRequested: (state): void => {
      state.isLogoutPending = true;
      state.error = null;
    },
    tenantUpdateRequested: (state): void => {
      state.isTenantUpdateLoading = true;
      state.tenantUpdateError = null;
    },
    tenantUpdateCompleted: (state): void => {
      state.isTenantUpdateLoading = false;
    },
    tenantUpdateFailed: (state, action: PayloadAction<string>): void => {
      state.isTenantUpdateLoading = false;
      state.tenantUpdateError = action.payload;
    },
    clearTenantUpdateError: (state): void => {
      state.tenantUpdateError = null;
    },
    displayNameSaveRequested: (state): void => {
      state.isDisplayNameSaving = true;
      state.displayNameSaveError = null;
    },
    displayNameSaveSucceeded: (
      state,
      action: PayloadAction<{ displayName: string | null }>,
    ): void => {
      state.isDisplayNameSaving = false;
      state.displayNameSaveError = null;
      state.displayName = action.payload.displayName;
    },
    displayNameSaveFailed: (state, action: PayloadAction<string>): void => {
      state.isDisplayNameSaving = false;
      state.displayNameSaveError = action.payload;
    },
    clearDisplayNameSaveError: (state): void => {
      state.displayNameSaveError = null;
    },
    logout: (state): void => {
      state.isAuthenticated = false;
      state.email = null;
      state.organizationName = null;
      state.tenantId = null;
      state.tenantRole = null;
      state.userId = null;
      state.displayName = null;
      state.isDisplayNameSaving = false;
      state.displayNameSaveError = null;
      state.isLoading = false;
      state.error = null;
      state.postRegisterLoginHint = null;
      state.mfaChallenge = null;
      state.isMfaVerifying = false;
      state.mfaError = null;
      state.tenantProfile = null;
      state.isTenantProfileLoading = false;
      state.tenantProfileError = null;
      state.isTenantUpdateLoading = false;
      state.tenantUpdateError = null;
      state.acceptInviteLoading = false;
      state.acceptInviteError = null;
      state.acceptInviteSucceeded = false;
      state.isLogoutPending = false;
      persistTenantSession({
        isAuthenticated: false,
        email: null,
        organizationName: null,
      });
    },
    logoutFailed: (state, action: PayloadAction<string>): void => {
      state.isLogoutPending = false;
      state.error = action.payload;
    },
  },
});

export const {
  clearError,
  tenantProfileRequested,
  tenantProfileSucceeded,
  tenantProfileFailed,
  tenantUpdateRequested,
  tenantUpdateCompleted,
  tenantUpdateFailed,
  clearTenantUpdateError,
  displayNameSaveRequested,
  displayNameSaveSucceeded,
  displayNameSaveFailed,
  clearDisplayNameSaveError,
  loginRequested,
  loginSucceeded,
  loginFailed,
  mfaChallengeIssued,
  mfaVerifyStarted,
  mfaVerifyFailed,
  mfaChallengeAbandoned,
  clearMfaError,
  loginCodeRequestStarted,
  loginCodeRequestFailed,
  registerRequested,
  registerSucceeded,
  registerFailed,
  acceptInviteRequested,
  acceptInviteSucceeded,
  acceptInviteFailed,
  clearAcceptInviteError,
  resetAcceptInviteUiState,
  clearPostRegisterLoginHint,
  logoutRequested,
  logout,
  logoutFailed,
} = tenantAuthSlice.actions;
