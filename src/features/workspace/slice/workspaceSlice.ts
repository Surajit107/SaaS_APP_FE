import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { logout } from '@/features/tenant/slice/tenantAuthSlice';
import type { Workspace } from '@/lib/api/Api';

export interface WorkspaceState {
  workspaces: Workspace[];
  isLoading: boolean;
  isCreating: boolean;
  deletingId: string | null;
  error: string | null;
  lastCreateSucceededAt: number | null;
  lastDeleteSucceededAt: number | null;
}

const initialState: WorkspaceState = {
  workspaces: [],
  isLoading: false,
  isCreating: false,
  deletingId: null,
  error: null,
  lastCreateSucceededAt: null,
  lastDeleteSucceededAt: null,
};

export const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    syncRequested: (state): void => {
      state.isLoading = true;
      state.error = null;
    },
    syncSucceeded: (state, action: PayloadAction<Workspace[]>): void => {
      state.isLoading = false;
      state.workspaces = action.payload;
      state.error = null;
    },
    syncFailed: (state, action: PayloadAction<string>): void => {
      state.isLoading = false;
      state.error = action.payload;
    },
    createRequested: (state): void => {
      state.isCreating = true;
      state.error = null;
    },
    createSucceeded: (state, action: PayloadAction<Workspace>): void => {
      state.isCreating = false;
      state.workspaces = [action.payload, ...state.workspaces];
      state.lastCreateSucceededAt = Date.now();
      state.error = null;
    },
    createFailed: (state, action: PayloadAction<string>): void => {
      state.isCreating = false;
      state.error = action.payload;
    },
    deleteRequested: (state, action: PayloadAction<string>): void => {
      state.deletingId = action.payload;
      state.error = null;
    },
    deleteSucceeded: (state, action: PayloadAction<string>): void => {
      state.deletingId = null;
      state.workspaces = state.workspaces.filter((w) => w.id !== action.payload);
      state.lastDeleteSucceededAt = Date.now();
      state.error = null;
    },
    deleteFailed: (state, action: PayloadAction<string>): void => {
      state.deletingId = null;
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const {
  syncRequested,
  syncSucceeded,
  syncFailed,
  createRequested,
  createSucceeded,
  createFailed,
  deleteRequested,
  deleteSucceeded,
  deleteFailed,
} = workspaceSlice.actions;
