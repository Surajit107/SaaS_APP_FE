import { createAction } from '@reduxjs/toolkit';
import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import { toast } from 'sonner';

import {
  ACCEPT_INVITE,
  GET_TENANT_ME,
  GET_ME,
  LOGIN,
  LOGOUT,
  PATCH_TENANT_ME,
  PATCH_TENANT_USER_ME,
  REGISTER,
  REQUEST_LOGIN_CODE,
  VERIFY_MFA,
  type AcceptInvitePayload,
  type AuthSessionData,
  type LoginPayload,
  type RegisterPayload,
  type TenantLoginPortalRole,
  type UpdateTenantMePayload,
  type UpdateTenantPayload,
} from '@/lib/api/Api';
import { getApiErrorMessage } from '@/lib/api/errorMessage';
import {
  acceptInviteFailed,
  acceptInviteSucceeded,
  displayNameSaveFailed,
  displayNameSaveRequested,
  displayNameSaveSucceeded,
  loginCodeRequestFailed,
  loginCodeRequestStarted,
  loginFailed,
  loginSucceeded,
  logout,
  logoutFailed,
  logoutRequested,
  mfaChallengeIssued,
  mfaVerifyFailed,
  mfaVerifyStarted,
  registerFailed,
  registerSucceeded,
  tenantProfileFailed,
  tenantProfileRequested,
  tenantProfileSucceeded,
  tenantUpdateCompleted,
  tenantUpdateFailed,
  tenantUpdateRequested,
} from '@/features/tenant/slice/tenantAuthSlice';
import { tenantSubscriptionPromptRequested } from '@/features/subscription/saga/tenantSubscriptionSaga';
import { clearAuthStorage, getRefreshToken, storeAuthTokens } from '@/lib/auth/tokenStorage';
import { isMfaRequiredResult } from '@/lib/auth/mfa';
import {
  clearPostLogoutTenantLoginPath,
  setPostLogoutTenantLoginPath,
} from '@/lib/tenant/postLogoutTenantLogin';
import type { RootState } from '@/store/store';

export const tenantLoginRequested = createAction<{
  email: string;
  password: string;
  tenantRole: TenantLoginPortalRole;
}>('tenantAuth/loginRequested');

export const tenantRegisterRequested = createAction<{
  organizationName: string;
  displayName: string;
  email: string;
  password: string;
}>('tenantAuth/registerRequested');

/** Second step of a login that answered with a challenge (authenticator or recovery code). */
export const tenantMfaVerifyRequested = createAction<{ code: string }>(
  'tenantAuth/mfaVerifyFlowRequested',
);

/** Passwordless entry: email a one-time code instead of asking for a password. */
export const tenantLoginCodeRequested = createAction<{
  email: string;
  tenantRole: TenantLoginPortalRole;
}>('tenantAuth/loginCodeFlowRequested');

export const tenantSessionSyncRequested = createAction('tenantAuth/sessionSyncRequested');
export const tenantProfileSyncRequested = createAction('tenantAuth/tenantProfileSyncRequested');

export const tenantOrganizationUpdateRequested =
  createAction<UpdateTenantPayload>('tenantAuth/tenantOrganizationUpdateRequested');

export const tenantDisplayNameUpdateRequested = createAction<UpdateTenantMePayload>(
  'tenantAuth/tenantDisplayNameUpdateRequested',
);

export const tenantAcceptInviteRequested = createAction<AcceptInvitePayload>(
  'tenantAuth/acceptInviteRequested',
);

/** Shared tail of both login paths: persist tokens and light up the session. */
function* establishTenantSession(
  session: AuthSessionData,
  successMessage: string,
): Generator {
  storeAuthTokens(session.accessToken, session.refreshToken);
  clearPostLogoutTenantLoginPath();
  toast.success(successMessage);
  yield put(
    loginSucceeded({
      id: session.user.id,
      email: session.user.email,
      tenantId: session.user.tenantId,
      tenantRole: session.user.tenantRole,
      displayName: session.user.displayName,
    }),
  );
  yield put(tenantSubscriptionPromptRequested());
}

function* handleTenantLogin(
  action: ReturnType<typeof tenantLoginRequested>,
): Generator {
  try {
    const payload: LoginPayload = {
      email: action.payload.email,
      password: action.payload.password,
      authScope: 'tenant',
      tenantRole: action.payload.tenantRole,
    };
    const response = (yield call(LOGIN, payload)) as Awaited<ReturnType<typeof LOGIN>>;
    const result = response.data.data;

    // 2FA account: the password alone bought a challenge, not a session.
    if (isMfaRequiredResult(result)) {
      yield put(
        mfaChallengeIssued({
          challengeToken: result.challengeToken,
          methods: result.methods,
          expiresAt: result.expiresAt,
          email: action.payload.email,
        }),
      );
      return;
    }

    yield* establishTenantSession(result, 'Signed in successfully');
  } catch (error: unknown) {
    const message = getApiErrorMessage(error);
    toast.error(message);
    yield put(loginFailed(message));
  }
}

function* handleTenantLoginCodeRequest(
  action: ReturnType<typeof tenantLoginCodeRequested>,
): Generator {
  try {
    yield put(loginCodeRequestStarted());
    const response = (yield call(REQUEST_LOGIN_CODE, {
      email: action.payload.email,
      authScope: 'tenant',
      tenantRole: action.payload.tenantRole,
    })) as Awaited<ReturnType<typeof REQUEST_LOGIN_CODE>>;

    // The server answers the same way for unknown addresses, so this branch is
    // reached whether or not a code was actually sent.
    const result = response.data.data;
    toast.success(response.data.message);
    yield put(
      mfaChallengeIssued({
        challengeToken: result.challengeToken,
        methods: result.methods,
        expiresAt: result.expiresAt,
        email: action.payload.email,
      }),
    );
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to send a sign-in code');
    toast.error(message);
    yield put(loginCodeRequestFailed(message));
  }
}

function* handleTenantMfaVerify(
  action: ReturnType<typeof tenantMfaVerifyRequested>,
): Generator {
  const challenge = (yield select(
    (state: RootState) => state.tenantAuth.mfaChallenge,
  )) as RootState['tenantAuth']['mfaChallenge'];

  if (challenge === null) {
    yield put(
      mfaVerifyFailed('This sign-in request expired. Please sign in again.'),
    );
    return;
  }

  try {
    yield put(mfaVerifyStarted());
    const response = (yield call(VERIFY_MFA, {
      challengeToken: challenge.challengeToken,
      code: action.payload.code,
    })) as Awaited<ReturnType<typeof VERIFY_MFA>>;

    yield* establishTenantSession(response.data.data, response.data.message);
  } catch (error: unknown) {
    const message = getApiErrorMessage(error);
    toast.error(message);
    yield put(mfaVerifyFailed(message));
  }
}

function* handleTenantAcceptInvite(
  action: ReturnType<typeof tenantAcceptInviteRequested>,
): Generator {
  try {
    /**
     * Do NOT `put(acceptInviteRequested())` here — its action type is identical to
     * `tenantAcceptInviteRequested` (`tenantAuth/acceptInviteRequested`), so that put
     * re-fires this saga (takeLatest) and freezes the UI.
     * The slice reducer already ran when the user dispatched `tenantAcceptInviteRequested`.
     */
    const payload: AcceptInvitePayload = {
      email: action.payload.email,
      token: action.payload.token,
      password: action.payload.password,
    };
    yield call(ACCEPT_INVITE, payload);
    toast.success('Account activated. You can sign in with your email and password.');
    yield put(acceptInviteSucceeded());
  } catch (error: unknown) {
    const message = getApiErrorMessage(
      error,
      'Failed to activate your account. The link may have expired.',
    );
    toast.error(message);
    yield put(acceptInviteFailed(message));
  }
}

function* handleTenantRegister(
  action: ReturnType<typeof tenantRegisterRequested>,
): Generator {
  try {
    const payload: RegisterPayload = {
      organizationName: action.payload.organizationName,
      displayName: action.payload.displayName,
      email: action.payload.email,
      password: action.payload.password,
    };
    const response = (yield call(
      REGISTER,
      payload,
    )) as Awaited<ReturnType<typeof REGISTER>>;
    const data = response.data.data;
    toast.success(
      'Workspace created. Check your email for a verification link, then sign in.',
    );

    yield put(
      registerSucceeded({
        email: data.email,
      }),
    );
  } catch (error: unknown) {
    const message = getApiErrorMessage(error);
    toast.error(message);
    yield put(registerFailed(message));
  }
}

function* handleLogout(): Generator {
  let logoutRequestSucceeded = true;
  try {
    const refreshToken = getRefreshToken();
    yield call(LOGOUT, refreshToken !== null ? { refreshToken } : {});
    toast.success('Logged out successfully');
  } catch (error: unknown) {
    logoutRequestSucceeded = false;
    const message = getApiErrorMessage(error);
    toast.error(message);
    yield put(logoutFailed(message));
  } finally {
    clearAuthStorage();
    if (!logoutRequestSucceeded) {
      toast.info('Local session cleared for security');
    }
    setPostLogoutTenantLoginPath('/');
    yield put(logout());
  }
}

function* handleTenantSessionSync(): Generator {
  try {
    const meResponse = (yield call(GET_ME)) as Awaited<ReturnType<typeof GET_ME>>;

    const me = meResponse.data.data;
    clearPostLogoutTenantLoginPath();
    yield put(
      loginSucceeded({
        id: me.id,
        email: me.email,
        tenantId: me.tenantId,
        tenantRole: me.tenantRole,
        displayName: me.displayName,
      }),
    );
    yield put(tenantSubscriptionPromptRequested());
  } catch (error: unknown) {
    const message = getApiErrorMessage(error);
    yield put(loginFailed(message));
    clearAuthStorage();
    yield put(logout());
  }
}

function* handleTenantProfileSync(): Generator {
  try {
    yield put(tenantProfileRequested());
    const response = (yield call(
      GET_TENANT_ME,
    )) as Awaited<ReturnType<typeof GET_TENANT_ME>>;
    yield put(tenantProfileSucceeded(response.data.data));
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to load tenant profile');
    yield put(tenantProfileFailed(message));
  }
}

function* handleTenantDisplayNameUpdate(
  action: ReturnType<typeof tenantDisplayNameUpdateRequested>,
): Generator {
  try {
    yield put(displayNameSaveRequested());
    const response = (yield call(
      PATCH_TENANT_USER_ME,
      action.payload,
    )) as Awaited<ReturnType<typeof PATCH_TENANT_USER_ME>>;
    const profile = response.data.data;
    const raw = profile.displayName;
    const normalized =
      typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null;
    yield put(displayNameSaveSucceeded({ displayName: normalized }));
    toast.success('Display name updated');
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to update display name');
    toast.error(message);
    yield put(displayNameSaveFailed(message));
  }
}

function* handleTenantOrganizationUpdate(
  action: ReturnType<typeof tenantOrganizationUpdateRequested>,
): Generator {
  try {
    yield put(tenantUpdateRequested());
    const response = (yield call(PATCH_TENANT_ME, action.payload)) as Awaited<
      ReturnType<typeof PATCH_TENANT_ME>
    >;
    yield put(tenantProfileSucceeded(response.data.data));
    yield put(tenantUpdateCompleted());
    toast.success('Organization updated');
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to update organization');
    toast.error(message);
    yield put(tenantUpdateFailed(message));
  }
}

export function* tenantAuthSaga(): Generator {
  yield all([
    takeLatest(tenantLoginRequested.type, handleTenantLogin),
    takeLatest(tenantMfaVerifyRequested.type, handleTenantMfaVerify),
    takeLatest(tenantLoginCodeRequested.type, handleTenantLoginCodeRequest),
    takeLatest(tenantRegisterRequested.type, handleTenantRegister),
    takeLatest(tenantAcceptInviteRequested.type, handleTenantAcceptInvite),
    takeLatest(logoutRequested.type, handleLogout),
    takeLatest(tenantSessionSyncRequested.type, handleTenantSessionSync),
    takeLatest(tenantProfileSyncRequested.type, handleTenantProfileSync),
    takeLatest(
      tenantOrganizationUpdateRequested.type,
      handleTenantOrganizationUpdate,
    ),
    takeLatest(
      tenantDisplayNameUpdateRequested.type,
      handleTenantDisplayNameUpdate,
    ),
  ]);
}
