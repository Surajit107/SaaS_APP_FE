import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import { toast } from 'sonner';

import {
  tenantUserAdminDeleteFlowRequested,
  tenantUserAdminDeleteSubmittingSet,
  tenantUserAdminDetailSheetClosed,
  tenantUserAdminDetailSyncFailed,
  tenantUserAdminDetailSyncRequested,
  tenantUserAdminDetailSyncSucceeded,
  tenantUserAdminInviteFlowRequested,
  tenantUserAdminInviteSheetClosed,
  tenantUserAdminInviteSubmittingSet,
  tenantUserAdminUpdateFlowRequested,
  tenantUserAdminUpdateSubmittingSet,
} from '@/features/tenant/slice/tenantUserAdminSlice';
import { tenantUserListSyncFlowRequested } from '@/features/tenant/saga/tenantUserListSaga';
import {
  DELETE_TENANT_USER,
  GET_TENANT_USER_BY_ID,
  INVITE_TENANT_USER,
  PATCH_TENANT_USER,
} from '@/lib/api/Api';
import { getApiErrorMessage } from '@/lib/api/errorMessage';
import type { UpdateTenantUserPayload } from '@/lib/api/types';
import type { RootState } from '@/store/store';

function* refreshTenantUserList(): Generator {
  const params = (yield select(
    (state: RootState) => state.tenantUserList.params,
  )) as RootState['tenantUserList']['params'];
  yield put(
    tenantUserListSyncFlowRequested({
      searchQuery: params.searchQuery,
      page: params.page,
    }),
  );
}

function* handleDetailSync(
  action: ReturnType<typeof tenantUserAdminDetailSyncRequested>,
): Generator {
  try {
    const response = (yield call(
      GET_TENANT_USER_BY_ID,
      action.payload.userId,
    )) as Awaited<ReturnType<typeof GET_TENANT_USER_BY_ID>>;
    yield put(tenantUserAdminDetailSyncSucceeded(response.data.data));
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to load user');
    toast.error(message);
    yield put(tenantUserAdminDetailSyncFailed(message));
  }
}

function* handleInviteFlow(
  action: ReturnType<typeof tenantUserAdminInviteFlowRequested>,
): Generator {
  yield put(tenantUserAdminInviteSubmittingSet(true));
  try {
    const response = (yield call(
      INVITE_TENANT_USER,
      action.payload,
    )) as Awaited<ReturnType<typeof INVITE_TENANT_USER>>;
    toast.success(response.data.message);
    yield put(tenantUserAdminInviteSheetClosed());
    yield call(refreshTenantUserList);
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to send invitation');
    toast.error(message);
  } finally {
    yield put(tenantUserAdminInviteSubmittingSet(false));
  }
}

function* handleUpdateFlow(
  action: ReturnType<typeof tenantUserAdminUpdateFlowRequested>,
): Generator {
  const { userId, ...body } = action.payload;
  const patchBody: UpdateTenantUserPayload = {};
  if (body.displayName !== undefined) {
    patchBody.displayName = body.displayName;
  }
  if (body.role !== undefined) {
    patchBody.role = body.role;
  }
  if (body.isActive !== undefined) {
    patchBody.isActive = body.isActive;
  }

  yield put(tenantUserAdminUpdateSubmittingSet(true));
  try {
    const response = (yield call(
      PATCH_TENANT_USER,
      userId,
      patchBody,
    )) as Awaited<ReturnType<typeof PATCH_TENANT_USER>>;
    toast.success(response.data.message);
    yield put(tenantUserAdminDetailSyncSucceeded(response.data.data));
    yield call(refreshTenantUserList);
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to update user');
    toast.error(message);
  } finally {
    yield put(tenantUserAdminUpdateSubmittingSet(false));
  }
}

function* handleDeleteFlow(
  action: ReturnType<typeof tenantUserAdminDeleteFlowRequested>,
): Generator {
  yield put(tenantUserAdminDeleteSubmittingSet(true));
  try {
    const response = (yield call(
      DELETE_TENANT_USER,
      action.payload.userId,
    )) as Awaited<ReturnType<typeof DELETE_TENANT_USER>>;
    toast.success(response.data.message);
    yield put(tenantUserAdminDetailSheetClosed());
    yield call(refreshTenantUserList);
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to delete user');
    toast.error(message);
  } finally {
    yield put(tenantUserAdminDeleteSubmittingSet(false));
  }
}

export function* tenantUserAdminSaga(): Generator {
  yield all([
    takeLatest(tenantUserAdminDetailSyncRequested, handleDetailSync),
    takeLatest(tenantUserAdminInviteFlowRequested, handleInviteFlow),
    takeLatest(tenantUserAdminUpdateFlowRequested, handleUpdateFlow),
    takeLatest(tenantUserAdminDeleteFlowRequested, handleDeleteFlow),
  ]);
}
