import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { logout } from '@/features/tenant/slice/tenantAuthSlice';
import type {
  TaskStatus,
  WorkspaceTask,
  WorkspaceTaskStatusCounts,
} from '@/lib/api/Api';

export type TaskFilter = TaskStatus | 'ALL';

function createEmptyStatusCounts(): WorkspaceTaskStatusCounts {
  return {
    TODO: 0,
    IN_PROGRESS: 0,
    BLOCKED: 0,
    DONE: 0,
  };
}

export interface WorkspaceTaskBoardState {
  activeWorkspaceId: string | null;
  tasks: WorkspaceTask[];
  statusCounts: WorkspaceTaskStatusCounts;
  isLoading: boolean;
  isCreating: boolean;
  updatingTaskId: string | null;
  editingTaskId: string | null;
  deletingTaskId: string | null;
  error: string | null;
  lastCreateSucceededAt: number | null;
  lastEditSucceededAt: number | null;
  lastDeleteSucceededAt: number | null;
  filters: {
    searchQuery: string;
    statusFilter: TaskFilter;
  };
  details: {
    open: boolean;
    taskId: string | null;
    task: WorkspaceTask | null;
    isLoading: boolean;
    error: string | null;
  };
}

const initialState: WorkspaceTaskBoardState = {
  activeWorkspaceId: null,
  tasks: [],
  statusCounts: createEmptyStatusCounts(),
  isLoading: false,
  isCreating: false,
  updatingTaskId: null,
  editingTaskId: null,
  deletingTaskId: null,
  error: null,
  lastCreateSucceededAt: null,
  lastEditSucceededAt: null,
  lastDeleteSucceededAt: null,
  filters: {
    searchQuery: '',
    statusFilter: 'ALL',
  },
  details: {
    open: false,
    taskId: null,
    task: null,
    isLoading: false,
    error: null,
  },
};

export const workspaceTaskBoardSlice = createSlice({
  name: 'workspaceTaskBoard',
  initialState,
  reducers: {
    workspaceActivated: (state, action: PayloadAction<string>): void => {
      if (state.activeWorkspaceId !== action.payload) {
        state.activeWorkspaceId = action.payload;
        state.tasks = [];
        state.statusCounts = createEmptyStatusCounts();
        state.filters = { searchQuery: '', statusFilter: 'ALL' };
        state.details = { open: false, taskId: null, task: null, isLoading: false, error: null };
        state.error = null;
      }
    },
    filtersUpdated: (
      state,
      action: PayloadAction<{
        searchQuery: string;
        statusFilter: TaskFilter;
      }>,
    ): void => {
      state.filters = action.payload;
    },
    boardSyncRequested: (state): void => {
      state.isLoading = true;
      state.error = null;
    },
    boardSyncSucceeded: (
      state,
      action: PayloadAction<{
        items: WorkspaceTask[];
        statusCounts: WorkspaceTaskStatusCounts;
      }>,
    ): void => {
      state.isLoading = false;
      state.tasks = action.payload.items;
      state.statusCounts = action.payload.statusCounts;
      state.error = null;
    },
    boardSyncFailed: (state, action: PayloadAction<string>): void => {
      state.isLoading = false;
      state.error = action.payload;
    },
    taskCreateRequested: (state): void => {
      state.isCreating = true;
      state.error = null;
    },
    taskCreateSucceeded: (state): void => {
      state.isCreating = false;
      state.lastCreateSucceededAt = Date.now();
      state.error = null;
    },
    taskCreateFailed: (state, action: PayloadAction<string>): void => {
      state.isCreating = false;
      state.error = action.payload;
    },
    taskAdvanceRequested: (state, action: PayloadAction<{ taskId: string }>): void => {
      state.updatingTaskId = action.payload.taskId;
      state.error = null;
    },
    taskAdvanceSucceeded: (state): void => {
      state.updatingTaskId = null;
    },
    taskAdvanceFailed: (state, action: PayloadAction<string>): void => {
      state.updatingTaskId = null;
      state.error = action.payload;
    },
    taskEditRequested: (state, action: PayloadAction<{ taskId: string }>): void => {
      state.editingTaskId = action.payload.taskId;
      state.error = null;
    },
    taskEditSucceeded: (state): void => {
      state.editingTaskId = null;
      state.lastEditSucceededAt = Date.now();
      state.error = null;
    },
    taskEditFailed: (state, action: PayloadAction<string>): void => {
      state.editingTaskId = null;
      state.error = action.payload;
    },
    taskDeleteRequested: (state, action: PayloadAction<{ taskId: string }>): void => {
      state.deletingTaskId = action.payload.taskId;
      state.error = null;
    },
    taskDeleteSucceeded: (state): void => {
      state.deletingTaskId = null;
      state.lastDeleteSucceededAt = Date.now();
      state.error = null;
    },
    taskDeleteFailed: (state, action: PayloadAction<string>): void => {
      state.deletingTaskId = null;
      state.error = action.payload;
    },
    taskDetailsRequested: (state, action: PayloadAction<{ taskId: string }>): void => {
      state.details.open = true;
      state.details.taskId = action.payload.taskId;
      state.details.task = null;
      state.details.isLoading = true;
      state.details.error = null;
    },
    taskDetailsSucceeded: (state, action: PayloadAction<WorkspaceTask>): void => {
      state.details.isLoading = false;
      state.details.task = action.payload;
      state.details.error = null;
    },
    taskDetailsFailed: (state, action: PayloadAction<string>): void => {
      state.details.isLoading = false;
      state.details.error = action.payload;
    },
    taskDetailsClosed: (state): void => {
      state.details.open = false;
      state.details.taskId = null;
      state.details.task = null;
      state.details.isLoading = false;
      state.details.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const {
  workspaceActivated,
  filtersUpdated,
  boardSyncRequested,
  boardSyncSucceeded,
  boardSyncFailed,
  taskCreateRequested,
  taskCreateSucceeded,
  taskCreateFailed,
  taskAdvanceRequested,
  taskAdvanceSucceeded,
  taskAdvanceFailed,
  taskEditRequested,
  taskEditSucceeded,
  taskEditFailed,
  taskDeleteRequested,
  taskDeleteSucceeded,
  taskDeleteFailed,
  taskDetailsRequested,
  taskDetailsSucceeded,
  taskDetailsFailed,
  taskDetailsClosed,
} = workspaceTaskBoardSlice.actions;
