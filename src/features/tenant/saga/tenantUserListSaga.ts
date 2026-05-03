import { createAction } from '@reduxjs/toolkit';
import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import { toast } from 'sonner';

import { GET_TENANT_USERS } from '@/lib/api/Api';
import { getApiErrorMessage } from '@/lib/api/errorMessage';
import type { RootState } from '@/store/store';
import {
  tenantUserListFetchFailed,
  tenantUserListFetchRequested,
  tenantUserListFetchSucceeded,
  tenantUserListParamsUpdated,
} from '@/features/tenant/slice/tenantUserListSlice';

const TENANT_USER_LIST_PAGE_SIZE = 20;
const TENANT_USER_LIST_MAX_LIMIT = 100;

function resolveTenantUserListLimit(requested: number | undefined): number {
  if (requested === undefined) {
    return TENANT_USER_LIST_PAGE_SIZE;
  }
  const n = Math.floor(requested);
  if (!Number.isFinite(n)) {
    return TENANT_USER_LIST_PAGE_SIZE;
  }
  return Math.min(TENANT_USER_LIST_MAX_LIMIT, Math.max(1, n));
}

export const tenantUserListSyncFlowRequested = createAction<{
  searchQuery?: string;
  page?: number;
  /** When set (1–100), passed to GET /tenant/users; otherwise defaults to 20. */
  limit?: number;
}>('tenantUserList/syncFlowRequested');

type TenantUserListSyncFlowAction = {
  payload: {
    searchQuery?: string;
    page?: number;
    limit?: number;
  };
};

function* handleTenantUserListSyncFlow(
  action: TenantUserListSyncFlowAction,
): Generator {
  try {
    const previousParams = (yield select(
      (state: RootState) => state.tenantUserList.params,
    )) as RootState['tenantUserList']['params'];

    const nextParams = {
      searchQuery:
        action.payload.searchQuery !== undefined
          ? action.payload.searchQuery
          : previousParams.searchQuery,
      page:
        action.payload.page !== undefined
          ? action.payload.page
          : previousParams.page,
    };

    yield put(tenantUserListParamsUpdated(nextParams));
    yield put(tenantUserListFetchRequested());

    const trimmedSearch = nextParams.searchQuery.trim();
    const limit = resolveTenantUserListLimit(action.payload.limit);
    const response = (yield call(GET_TENANT_USERS, {
      page: nextParams.page,
      limit,
      search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    })) as Awaited<ReturnType<typeof GET_TENANT_USERS>>;

    yield put(tenantUserListFetchSucceeded(response.data.data));
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to load tenant users');
    toast.error(message);
    yield put(tenantUserListFetchFailed(message));
  }
}

export function* tenantUserListSaga(): Generator {
  yield all([
    takeLatest(tenantUserListSyncFlowRequested, handleTenantUserListSyncFlow),
  ]);
}
