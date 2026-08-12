import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import { toast } from 'sonner';

import {
  DISABLE_TOTP,
  ENABLE_TOTP,
  GET_MFA_STATUS,
  PATCH_MFA_PREFERENCES,
  REGENERATE_BACKUP_CODES,
  SETUP_TOTP,
} from '@/lib/api/Api';
import { getApiErrorMessage } from '@/lib/api/errorMessage';
import { logout } from '@/features/tenant/slice/tenantAuthSlice';
import {
  backupCodesRegenerateFailed,
  backupCodesRegenerateSucceeded,
  mfaStatusSyncFailed,
  mfaStatusSyncSucceeded,
  preferenceSaveFailed,
  preferenceSaveSucceeded,
  tenantBackupCodesRegenerateRequested,
  tenantEmailCodeLoginPreferenceRequested,
  tenantMfaStatusSyncRequested,
  tenantTotpDisableRequested,
  tenantTotpEnableRequested,
  tenantTotpSetupRequested,
  totpDisableFailed,
  totpDisableSucceeded,
  totpEnableFailed,
  totpEnableSucceeded,
  totpSetupFailed,
  totpSetupSucceeded,
} from '@/features/tenant/slice/tenantSecuritySlice';
import { clearAuthStorage } from '@/lib/auth/tokenStorage';
import { setPostLogoutTenantLoginPath } from '@/lib/tenant/postLogoutTenantLogin';
import type { RootState } from '@/store/store';

function* handleMfaStatusSync(): Generator {
  try {
    const response = (yield call(GET_MFA_STATUS)) as Awaited<
      ReturnType<typeof GET_MFA_STATUS>
    >;
    yield put(mfaStatusSyncSucceeded(response.data.data));
  } catch (error: unknown) {
    const message = getApiErrorMessage(
      error,
      'Unable to load your security settings',
    );
    yield put(mfaStatusSyncFailed(message));
  }
}

function* handleTotpSetup(): Generator {
  try {
    const response = (yield call(SETUP_TOTP)) as Awaited<
      ReturnType<typeof SETUP_TOTP>
    >;
    yield put(totpSetupSucceeded(response.data.data));
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to start setup');
    toast.error(message);
    yield put(totpSetupFailed(message));
  }
}

function* handleTotpEnable(
  action: ReturnType<typeof tenantTotpEnableRequested>,
): Generator {
  try {
    const response = (yield call(ENABLE_TOTP, {
      code: action.payload.code,
    })) as Awaited<ReturnType<typeof ENABLE_TOTP>>;
    toast.success(response.data.message);
    yield put(totpEnableSucceeded(response.data.data));
    yield put(tenantMfaStatusSyncRequested());
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to turn on two-factor authentication');
    yield put(totpEnableFailed(message));
  }
}

/**
 * Turning 2FA off revokes every refresh token server-side, so the local session
 * is already dead — tear it down here instead of letting it fail on next refresh.
 */
function* handleTotpDisable(
  action: ReturnType<typeof tenantTotpDisableRequested>,
): Generator {
  try {
    const response = (yield call(DISABLE_TOTP, {
      password: action.payload.password,
      code: action.payload.code,
    })) as Awaited<ReturnType<typeof DISABLE_TOTP>>;

    yield put(totpDisableSucceeded(response.data.data));
    toast.success(response.data.message);

    const tenantRole = (yield select(
      (state: RootState) => state.tenantAuth.tenantRole,
    )) as RootState['tenantAuth']['tenantRole'];

    clearAuthStorage();
    setPostLogoutTenantLoginPath(
      tenantRole === 'member' ? '/tenant/user/login' : '/tenant/login',
    );
    yield put(logout());
  } catch (error: unknown) {
    const message = getApiErrorMessage(
      error,
      'Unable to turn off two-factor authentication',
    );
    yield put(totpDisableFailed(message));
  }
}

function* handleBackupCodesRegenerate(
  action: ReturnType<typeof tenantBackupCodesRegenerateRequested>,
): Generator {
  try {
    const response = (yield call(REGENERATE_BACKUP_CODES, {
      password: action.payload.password,
    })) as Awaited<ReturnType<typeof REGENERATE_BACKUP_CODES>>;
    toast.success(response.data.message);
    yield put(backupCodesRegenerateSucceeded(response.data.data));
    yield put(tenantMfaStatusSyncRequested());
  } catch (error: unknown) {
    const message = getApiErrorMessage(
      error,
      'Unable to generate new recovery codes',
    );
    yield put(backupCodesRegenerateFailed(message));
  }
}

function* handleEmailCodePreference(
  action: ReturnType<typeof tenantEmailCodeLoginPreferenceRequested>,
): Generator {
  try {
    const response = (yield call(PATCH_MFA_PREFERENCES, {
      isEmailCodeLoginEnabled: action.payload.isEmailCodeLoginEnabled,
    })) as Awaited<ReturnType<typeof PATCH_MFA_PREFERENCES>>;
    yield put(preferenceSaveSucceeded(response.data.data));
    toast.success(
      action.payload.isEmailCodeLoginEnabled
        ? 'Sign-in codes by email are on.'
        : 'Sign-in codes by email are off.',
    );
  } catch (error: unknown) {
    const message = getApiErrorMessage(
      error,
      'Unable to update your sign-in preferences',
    );
    yield put(preferenceSaveFailed(message));
  }
}

export function* tenantSecuritySaga(): Generator {
  yield all([
    takeLatest(tenantMfaStatusSyncRequested.type, handleMfaStatusSync),
    takeLatest(tenantTotpSetupRequested.type, handleTotpSetup),
    takeLatest(tenantTotpEnableRequested.type, handleTotpEnable),
    takeLatest(tenantTotpDisableRequested.type, handleTotpDisable),
    takeLatest(
      tenantBackupCodesRegenerateRequested.type,
      handleBackupCodesRegenerate,
    ),
    takeLatest(
      tenantEmailCodeLoginPreferenceRequested.type,
      handleEmailCodePreference,
    ),
  ]);
}
