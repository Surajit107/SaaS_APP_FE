import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { logout } from '@/features/tenant/slice/tenantAuthSlice';
import type { PaginatedTenantUsersData, TenantUserProfile } from '@/lib/api/types';

export interface TenantUserListState {
  users: TenantUserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  params: {
    searchQuery: string;
    page: number;
  };
}

const initialState: TenantUserListState = {
  users: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  isLoading: false,
  error: null,
  params: {
    searchQuery: '',
    page: 1,
  },
};

export const tenantUserListSlice = createSlice({
  name: 'tenantUserList',
  initialState,
  reducers: {
    tenantUserListParamsUpdated: (
      state,
      action: PayloadAction<{ searchQuery: string; page: number }>,
    ): void => {
      state.params = action.payload;
    },
    tenantUserListFetchRequested: (state): void => {
      state.isLoading = true;
      state.error = null;
    },
    tenantUserListFetchSucceeded: (
      state,
      action: PayloadAction<PaginatedTenantUsersData>,
    ): void => {
      state.isLoading = false;
      state.users = action.payload.users;
      state.total = action.payload.total;
      state.page = action.payload.page;
      state.limit = action.payload.limit;
      state.totalPages = action.payload.totalPages;
      state.error = null;
    },
    tenantUserListFetchFailed: (state, action: PayloadAction<string>): void => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const {
  tenantUserListParamsUpdated,
  tenantUserListFetchRequested,
  tenantUserListFetchSucceeded,
  tenantUserListFetchFailed,
} = tenantUserListSlice.actions;
