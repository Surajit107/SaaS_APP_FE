import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { logout } from '@/features/tenant/slice/tenantAuthSlice';
import type { BillingPlan, TenantSubscriptionSnapshot } from '@/lib/api/Api';

export interface TenantSubscriptionCurrentPlanDetail {
  planId: string | null;
  plan: BillingPlan | null;
  isLoading: boolean;
  error: string | null;
}

export interface TenantSubscriptionState {
  plans: BillingPlan[];
  subscription: TenantSubscriptionSnapshot | null;
  isChecking: boolean;
  isModalOpen: boolean;
  checkoutPlanId: string | null;
  isCancelling: boolean;
  isRefunding: boolean;
  /** Fresh catalog row when Manage subscription is open (GET /billing/plans/:planId). */
  currentPlanDetail: TenantSubscriptionCurrentPlanDetail;
  checkoutSync: {
    isLoading: boolean;
    isSynced: boolean;
    sessionId: string | null;
    subscriptionStatus: string | null;
    planKey: string | null;
    error: string | null;
  };
  error: string | null;
}

const currentPlanDetailInitial: TenantSubscriptionCurrentPlanDetail = {
  planId: null,
  plan: null,
  isLoading: false,
  error: null,
};

const initialState: TenantSubscriptionState = {
  plans: [],
  subscription: null,
  isChecking: false,
  isModalOpen: false,
  checkoutPlanId: null,
  isCancelling: false,
  isRefunding: false,
  currentPlanDetail: currentPlanDetailInitial,
  checkoutSync: {
    isLoading: false,
    isSynced: false,
    sessionId: null,
    subscriptionStatus: null,
    planKey: null,
    error: null,
  },
  error: null,
};

export const tenantSubscriptionSlice = createSlice({
  name: 'tenantSubscription',
  initialState,
  reducers: {
    promptCheckRequested: (state): void => {
      state.isChecking = true;
      state.error = null;
    },
    promptCheckSucceeded: (
      state,
      action: PayloadAction<{
        plans: BillingPlan[];
        subscription: TenantSubscriptionSnapshot;
        openModal: boolean;
      }>,
    ): void => {
      state.plans = action.payload.plans;
      state.subscription = action.payload.subscription;
      state.isChecking = false;
      state.isModalOpen = action.payload.openModal;
      state.error = null;
    },
    promptCheckFailed: (state, action: PayloadAction<string>): void => {
      state.isChecking = false;
      state.isModalOpen = false;
      state.error = action.payload;
    },
    checkoutRequested: (
      state,
      action: PayloadAction<{ stripePriceId: string }>,
    ): void => {
      state.checkoutPlanId = action.payload.stripePriceId;
      state.error = null;
    },
    checkoutCompleted: (state): void => {
      state.checkoutPlanId = null;
    },
    checkoutFailed: (state, action: PayloadAction<string>): void => {
      state.checkoutPlanId = null;
      state.error = action.payload;
    },
    modalDismissed: (state): void => {
      state.isModalOpen = false;
    },
    checkoutSyncRequested: (
      state,
      action: PayloadAction<{ sessionId: string }>,
    ): void => {
      state.checkoutSync.isLoading = true;
      state.checkoutSync.error = null;
      state.checkoutSync.sessionId = action.payload.sessionId;
    },
    checkoutSyncSucceeded: (
      state,
      action: PayloadAction<{
        sessionId: string;
        synced: boolean;
        subscriptionStatus: string;
        planKey: string;
      }>,
    ): void => {
      state.checkoutSync.isLoading = false;
      state.checkoutSync.isSynced = action.payload.synced;
      state.checkoutSync.sessionId = action.payload.sessionId;
      state.checkoutSync.subscriptionStatus = action.payload.subscriptionStatus;
      state.checkoutSync.planKey = action.payload.planKey;
      state.checkoutSync.error = null;
    },
    subscriptionSnapshotUpdated: (
      state,
      action: PayloadAction<TenantSubscriptionSnapshot>,
    ): void => {
      state.subscription = action.payload;
      state.checkoutSync.subscriptionStatus = action.payload.status;
      state.checkoutSync.planKey = action.payload.planKey;
    },
    subscriptionModalOpened: (state): void => {
      state.isModalOpen = true;
      state.error = null;
    },
    cancelRequested: (state): void => {
      state.isCancelling = true;
      state.error = null;
    },
    cancelCompleted: (state): void => {
      state.isCancelling = false;
    },
    cancelFailed: (state, action: PayloadAction<string>): void => {
      state.isCancelling = false;
      state.error = action.payload;
    },
    refundRequested: (state): void => {
      state.isRefunding = true;
      state.error = null;
    },
    refundCompleted: (state): void => {
      state.isRefunding = false;
    },
    refundFailed: (state, action: PayloadAction<string>): void => {
      state.isRefunding = false;
      state.error = action.payload;
    },
    checkoutSyncFailed: (state, action: PayloadAction<string>): void => {
      state.checkoutSync.isLoading = false;
      state.checkoutSync.error = action.payload;
    },
    checkoutSyncCleared: (state): void => {
      state.checkoutSync = {
        isLoading: false,
        isSynced: false,
        sessionId: null,
        subscriptionStatus: null,
        planKey: null,
        error: null,
      };
    },
    clearError: (state): void => {
      state.error = null;
    },
    currentPlanDetailLoadStarted: (
      state,
      action: PayloadAction<{ planId: string }>,
    ): void => {
      state.currentPlanDetail.planId = action.payload.planId;
      state.currentPlanDetail.isLoading = true;
      state.currentPlanDetail.error = null;
      state.currentPlanDetail.plan = null;
    },
    currentPlanDetailLoadSucceeded: (
      state,
      action: PayloadAction<BillingPlan>,
    ): void => {
      state.currentPlanDetail.plan = action.payload;
      state.currentPlanDetail.planId = action.payload.id;
      state.currentPlanDetail.isLoading = false;
      state.currentPlanDetail.error = null;
    },
    currentPlanDetailLoadFailed: (state, action: PayloadAction<string>): void => {
      state.currentPlanDetail.isLoading = false;
      state.currentPlanDetail.error = action.payload;
      state.currentPlanDetail.plan = null;
    },
    currentPlanDetailCleared: (state): void => {
      state.currentPlanDetail = currentPlanDetailInitial;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const {
  promptCheckRequested,
  promptCheckSucceeded,
  promptCheckFailed,
  checkoutRequested,
  checkoutCompleted,
  checkoutFailed,
  modalDismissed,
  checkoutSyncRequested,
  checkoutSyncSucceeded,
  checkoutSyncFailed,
  checkoutSyncCleared,
  subscriptionSnapshotUpdated,
  subscriptionModalOpened,
  cancelRequested,
  cancelCompleted,
  cancelFailed,
  refundRequested,
  refundCompleted,
  refundFailed,
  clearError,
  currentPlanDetailLoadStarted,
  currentPlanDetailLoadSucceeded,
  currentPlanDetailLoadFailed,
  currentPlanDetailCleared,
} = tenantSubscriptionSlice.actions;
