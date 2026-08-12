import { createAction, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { logout } from '@/features/tenant/slice/tenantAuthSlice';
import type {
  BackupCodesData,
  MfaStatus,
  TotpEnrollmentData,
} from '@/lib/api/types';

export interface TenantSecurityState {
  status: MfaStatus | null;
  isStatusLoading: boolean;
  statusError: string | null;
  /** Scanned-but-unconfirmed authenticator secret; nothing is enforced yet. */
  enrollment: TotpEnrollmentData | null;
  isEnrollmentStarting: boolean;
  isEnabling: boolean;
  isDisabling: boolean;
  isRegenerating: boolean;
  isPreferenceSaving: boolean;
  /** Shared by enroll / enable / disable / regenerate — one at a time by design. */
  actionError: string | null;
  /** Plain recovery codes, held in memory until the user confirms they saved them. */
  issuedBackupCodes: string[] | null;
}

const initialState: TenantSecurityState = {
  status: null,
  isStatusLoading: false,
  statusError: null,
  enrollment: null,
  isEnrollmentStarting: false,
  isEnabling: false,
  isDisabling: false,
  isRegenerating: false,
  isPreferenceSaving: false,
  actionError: null,
  issuedBackupCodes: null,
};

export const tenantMfaStatusSyncRequested = createAction(
  'tenantSecurity/mfaStatusSyncRequested',
);

export const tenantTotpSetupRequested = createAction(
  'tenantSecurity/totpSetupRequested',
);

export const tenantTotpEnableRequested = createAction<{ code: string }>(
  'tenantSecurity/totpEnableRequested',
);

export const tenantTotpDisableRequested = createAction<{
  password: string;
  code: string;
}>('tenantSecurity/totpDisableRequested');

export const tenantBackupCodesRegenerateRequested = createAction<{
  password: string;
}>('tenantSecurity/backupCodesRegenerateRequested');

/** Allows or blocks passwordless sign-in with a code emailed to this account. */
export const tenantEmailCodeLoginPreferenceRequested = createAction<{
  isEmailCodeLoginEnabled: boolean;
}>('tenantSecurity/emailCodeLoginPreferenceRequested');

export const tenantSecuritySlice = createSlice({
  name: 'tenantSecurity',
  initialState,
  reducers: {
    mfaStatusSyncSucceeded: (state, action: PayloadAction<MfaStatus>): void => {
      state.isStatusLoading = false;
      state.statusError = null;
      state.status = action.payload;
    },
    mfaStatusSyncFailed: (state, action: PayloadAction<string>): void => {
      state.isStatusLoading = false;
      state.statusError = action.payload;
    },
    totpSetupSucceeded: (
      state,
      action: PayloadAction<TotpEnrollmentData>,
    ): void => {
      state.isEnrollmentStarting = false;
      state.actionError = null;
      state.enrollment = action.payload;
    },
    totpSetupFailed: (state, action: PayloadAction<string>): void => {
      state.isEnrollmentStarting = false;
      state.actionError = action.payload;
    },
    totpEnableSucceeded: (
      state,
      action: PayloadAction<BackupCodesData>,
    ): void => {
      state.isEnabling = false;
      state.actionError = null;
      state.enrollment = null;
      state.issuedBackupCodes = action.payload.backupCodes;
    },
    totpEnableFailed: (state, action: PayloadAction<string>): void => {
      state.isEnabling = false;
      state.actionError = action.payload;
    },
    totpDisableSucceeded: (state, action: PayloadAction<MfaStatus>): void => {
      state.isDisabling = false;
      state.actionError = null;
      state.status = action.payload;
      state.issuedBackupCodes = null;
    },
    totpDisableFailed: (state, action: PayloadAction<string>): void => {
      state.isDisabling = false;
      state.actionError = action.payload;
    },
    backupCodesRegenerateSucceeded: (
      state,
      action: PayloadAction<BackupCodesData>,
    ): void => {
      state.isRegenerating = false;
      state.actionError = null;
      state.issuedBackupCodes = action.payload.backupCodes;
    },
    backupCodesRegenerateFailed: (
      state,
      action: PayloadAction<string>,
    ): void => {
      state.isRegenerating = false;
      state.actionError = action.payload;
    },
    preferenceSaveSucceeded: (
      state,
      action: PayloadAction<MfaStatus>,
    ): void => {
      state.isPreferenceSaving = false;
      state.actionError = null;
      state.status = action.payload;
    },
    preferenceSaveFailed: (state, action: PayloadAction<string>): void => {
      state.isPreferenceSaving = false;
      state.actionError = action.payload;
    },
    /** Call once the codes have been shown and acknowledged — they cannot be re-read. */
    issuedBackupCodesDismissed: (state): void => {
      state.issuedBackupCodes = null;
    },
    securityActionErrorCleared: (state): void => {
      state.actionError = null;
    },
    /** Drops in-flight enrollment UI state, e.g. when the dialog closes. */
    securityDialogReset: (state): void => {
      state.enrollment = null;
      state.issuedBackupCodes = null;
      state.actionError = null;
      state.isEnrollmentStarting = false;
      state.isEnabling = false;
      state.isDisabling = false;
      state.isRegenerating = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(tenantMfaStatusSyncRequested, (state) => {
        state.isStatusLoading = true;
        state.statusError = null;
      })
      .addCase(tenantTotpSetupRequested, (state) => {
        state.isEnrollmentStarting = true;
        state.actionError = null;
      })
      .addCase(tenantTotpEnableRequested, (state) => {
        state.isEnabling = true;
        state.actionError = null;
      })
      .addCase(tenantTotpDisableRequested, (state) => {
        state.isDisabling = true;
        state.actionError = null;
      })
      .addCase(tenantBackupCodesRegenerateRequested, (state) => {
        state.isRegenerating = true;
        state.actionError = null;
      })
      .addCase(tenantEmailCodeLoginPreferenceRequested, (state) => {
        state.isPreferenceSaving = true;
        state.actionError = null;
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  mfaStatusSyncSucceeded,
  mfaStatusSyncFailed,
  totpSetupSucceeded,
  totpSetupFailed,
  totpEnableSucceeded,
  totpEnableFailed,
  totpDisableSucceeded,
  totpDisableFailed,
  backupCodesRegenerateSucceeded,
  backupCodesRegenerateFailed,
  preferenceSaveSucceeded,
  preferenceSaveFailed,
  issuedBackupCodesDismissed,
  securityActionErrorCleared,
  securityDialogReset,
} = tenantSecuritySlice.actions;
