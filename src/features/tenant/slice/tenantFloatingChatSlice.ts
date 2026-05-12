import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  promptCheckSucceeded,
  subscriptionSnapshotUpdated,
} from '@/features/subscription/slice/tenantSubscriptionSlice';
import { logout } from '@/features/tenant/slice/tenantAuthSlice';
import type { ChatMessage, ChatSession, TenantSubscriptionSnapshot } from '@/lib/api/Api';

export interface TenantFloatingChatAssistantRevealSeed {
  messageId: string;
  full: string;
}

export interface TenantFloatingChatState {
  /** null until first bootstrap completes */
  allowed: boolean | null;
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  isBootstrapping: boolean;
  isMessagesLoading: boolean;
  isSending: boolean;
  isCreatingSession: boolean;
  deletingSessionId: string | null;
  error: string | null;
  /** After first successful or failed bootstrap; avoids refetch on every panel open */
  isPrimed: boolean;
  draftRestore: string | null;
  assistantRevealSeed: TenantFloatingChatAssistantRevealSeed | null;
}

const initialState: TenantFloatingChatState = {
  allowed: null,
  sessions: [],
  activeSessionId: null,
  messages: [],
  isBootstrapping: false,
  isMessagesLoading: false,
  isSending: false,
  isCreatingSession: false,
  deletingSessionId: null,
  error: null,
  isPrimed: false,
  draftRestore: null,
  assistantRevealSeed: null,
};

function subscriptionSnapshotDeniesAiChatbot(snapshot: TenantSubscriptionSnapshot): boolean {
  return snapshot.plan?.entitlements?.aiChatbot === false;
}

function markAssistantIneligible(state: TenantFloatingChatState): void {
  state.isBootstrapping = false;
  state.isPrimed = true;
  state.allowed = false;
  state.sessions = [];
  state.activeSessionId = null;
  state.messages = [];
  state.isMessagesLoading = false;
  state.assistantRevealSeed = null;
}

export const tenantFloatingChatSlice = createSlice({
  name: 'tenantFloatingChat',
  initialState,
  reducers: {
    bootstrapRequested: (state): void => {
      state.isBootstrapping = true;
      state.error = null;
    },
    bootstrapEligibleCompleted: (
      state,
      action: PayloadAction<{
        sessions: ChatSession[];
        activeSessionId: string;
        messages: ChatMessage[];
      }>,
    ): void => {
      state.isBootstrapping = false;
      state.isPrimed = true;
      state.allowed = true;
      state.sessions = action.payload.sessions;
      state.activeSessionId = action.payload.activeSessionId;
      state.messages = action.payload.messages;
      state.isMessagesLoading = false;
      state.assistantRevealSeed = null;
      state.error = null;
    },
    bootstrapIneligibleCompleted: (state): void => {
      markAssistantIneligible(state);
    },
    bootstrapFailed: (state, action: PayloadAction<string>): void => {
      state.isBootstrapping = false;
      state.isPrimed = true;
      state.allowed = false;
      state.error = action.payload;
    },
    selectSessionRequested: (state, action: PayloadAction<string>): void => {
      state.activeSessionId = action.payload;
      state.isMessagesLoading = true;
      state.error = null;
      state.assistantRevealSeed = null;
    },
    selectSessionSucceeded: (state, action: PayloadAction<ChatMessage[]>): void => {
      state.isMessagesLoading = false;
      state.messages = action.payload;
      state.error = null;
    },
    selectSessionFailed: (state, action: PayloadAction<string>): void => {
      state.isMessagesLoading = false;
      state.error = action.payload;
    },
    createSessionRequested: (state): void => {
      state.isCreatingSession = true;
      state.error = null;
    },
    createSessionSucceeded: (
      state,
      action: PayloadAction<{ session: ChatSession; messages: ChatMessage[] }>,
    ): void => {
      state.isCreatingSession = false;
      state.sessions = [action.payload.session, ...state.sessions];
      state.activeSessionId = action.payload.session.id;
      state.messages = action.payload.messages;
      state.assistantRevealSeed = null;
      state.error = null;
    },
    createSessionFailed: (state, action: PayloadAction<string>): void => {
      state.isCreatingSession = false;
      state.error = action.payload;
    },
    sendMessageRequested: (state): void => {
      state.isSending = true;
      state.error = null;
      state.assistantRevealSeed = null;
    },
    sendMessageSucceeded: (
      state,
      action: PayloadAction<{
        messages: ChatMessage[];
        sessions: ChatSession[];
        assistantRevealSeed: TenantFloatingChatAssistantRevealSeed;
      }>,
    ): void => {
      state.isSending = false;
      state.messages = action.payload.messages;
      state.sessions = action.payload.sessions;
      state.assistantRevealSeed = action.payload.assistantRevealSeed;
      state.error = null;
    },
    sendMessageFailed: (
      state,
      action: PayloadAction<{ message: string; draftRestore: string }>,
    ): void => {
      state.isSending = false;
      state.error = action.payload.message;
      state.draftRestore = action.payload.draftRestore;
    },
    deleteSessionRequested: (state, action: PayloadAction<string>): void => {
      state.deletingSessionId = action.payload;
      state.error = null;
    },
    deleteSessionSucceeded: (
      state,
      action: PayloadAction<{
        sessions: ChatSession[];
        activeSessionId: string | null;
        messages: ChatMessage[];
      }>,
    ): void => {
      state.deletingSessionId = null;
      state.sessions = action.payload.sessions;
      state.activeSessionId = action.payload.activeSessionId;
      state.messages = action.payload.messages;
      state.assistantRevealSeed = null;
      state.error = null;
    },
    deleteSessionFailed: (state, action: PayloadAction<string>): void => {
      state.deletingSessionId = null;
      state.error = action.payload;
    },
    assistantRevealConsumed: (state): void => {
      state.assistantRevealSeed = null;
    },
    draftRestoreConsumed: (state): void => {
      state.draftRestore = null;
    },
    /** When the floating widget unmounts (e.g. leave tenant shell); next open re-bootstraps like a fresh mount */
    scopeReset: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
    builder.addCase(subscriptionSnapshotUpdated, (state, action) => {
      if (!subscriptionSnapshotDeniesAiChatbot(action.payload)) {
        return;
      }
      markAssistantIneligible(state);
    });
    builder.addCase(promptCheckSucceeded, (state, action) => {
      if (!subscriptionSnapshotDeniesAiChatbot(action.payload.subscription)) {
        return;
      }
      markAssistantIneligible(state);
    });
  },
});

export const {
  bootstrapRequested,
  bootstrapEligibleCompleted,
  bootstrapIneligibleCompleted,
  bootstrapFailed,
  selectSessionRequested,
  selectSessionSucceeded,
  selectSessionFailed,
  createSessionRequested,
  createSessionSucceeded,
  createSessionFailed,
  sendMessageRequested,
  sendMessageSucceeded,
  sendMessageFailed,
  deleteSessionRequested,
  deleteSessionSucceeded,
  deleteSessionFailed,
  assistantRevealConsumed,
  draftRestoreConsumed,
  scopeReset,
} = tenantFloatingChatSlice.actions;
