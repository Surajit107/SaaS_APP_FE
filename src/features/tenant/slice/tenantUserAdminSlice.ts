import { createAction, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { logout } from '@/features/tenant/slice/tenantAuthSlice';
import type {
  InviteTenantUserPayload,
  TenantUserProfile,
  UpdateTenantUserPayload,
} from '@/lib/api/types';

export type TenantUserAdminUpdateFlowPayload = {
  userId: string;
} & UpdateTenantUserPayload;

export interface TenantUserAdminState {
  detailOpen: boolean;
  detailUserId: string | null;
  detail: TenantUserProfile | null;
  detailLoading: boolean;
  detailError: string | null;
  inviteOpen: boolean;
  inviteSubmitting: boolean;
  updateSubmitting: boolean;
  deleteSubmitting: boolean;
}

const initialState: TenantUserAdminState = {
  detailOpen: false,
  detailUserId: null,
  detail: null,
  detailLoading: false,
  detailError: null,
  inviteOpen: false,
  inviteSubmitting: false,
  updateSubmitting: false,
  deleteSubmitting: false,
};

export const tenantUserAdminDetailSyncRequested = createAction<{ userId: string }>(
  'tenantUserAdmin/detailSyncRequested',
);

export const tenantUserAdminInviteFlowRequested = createAction<InviteTenantUserPayload>(
  'tenantUserAdmin/inviteFlowRequested',
);

export const tenantUserAdminUpdateFlowRequested =
  createAction<TenantUserAdminUpdateFlowPayload>('tenantUserAdmin/updateFlowRequested');

export const tenantUserAdminDeleteFlowRequested = createAction<{ userId: string }>(
  'tenantUserAdmin/deleteFlowRequested',
);

export const tenantUserAdminSlice = createSlice({
  name: 'tenantUserAdmin',
  initialState,
  reducers: {
    tenantUserAdminInviteSheetOpened: (state): void => {
      state.inviteOpen = true;
    },
    tenantUserAdminInviteSheetClosed: (state): void => {
      state.inviteOpen = false;
    },
    tenantUserAdminInviteSubmittingSet: (state, action: PayloadAction<boolean>): void => {
      state.inviteSubmitting = action.payload;
    },
    tenantUserAdminDetailSheetClosed: (state): void => {
      state.detailOpen = false;
      state.detailUserId = null;
      state.detail = null;
      state.detailLoading = false;
      state.detailError = null;
    },
    tenantUserAdminDetailSyncSucceeded: (
      state,
      action: PayloadAction<TenantUserProfile>,
    ): void => {
      state.detailLoading = false;
      state.detail = action.payload;
      state.detailError = null;
    },
    tenantUserAdminDetailSyncFailed: (state, action: PayloadAction<string>): void => {
      state.detailLoading = false;
      state.detail = null;
      state.detailError = action.payload;
    },
    tenantUserAdminUpdateSubmittingSet: (state, action: PayloadAction<boolean>): void => {
      state.updateSubmitting = action.payload;
    },
    tenantUserAdminDeleteSubmittingSet: (state, action: PayloadAction<boolean>): void => {
      state.deleteSubmitting = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(tenantUserAdminDetailSyncRequested, (state, { payload }) => {
        state.detailOpen = true;
        state.detailUserId = payload.userId;
        state.detailLoading = true;
        state.detail = null;
        state.detailError = null;
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  tenantUserAdminInviteSheetOpened,
  tenantUserAdminInviteSheetClosed,
  tenantUserAdminInviteSubmittingSet,
  tenantUserAdminDetailSheetClosed,
  tenantUserAdminDetailSyncSucceeded,
  tenantUserAdminDetailSyncFailed,
  tenantUserAdminUpdateSubmittingSet,
  tenantUserAdminDeleteSubmittingSet,
} = tenantUserAdminSlice.actions;
