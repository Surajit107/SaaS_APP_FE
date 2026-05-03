import { createAction } from '@reduxjs/toolkit';
import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import { toast } from 'sonner';

import {
  GET_MY_TASKS,
  GET_WORKSPACE_TASK_DETAILS,
  UPDATE_WORKSPACE_TASK,
  type TaskStatus,
} from '@/lib/api/Api';
import type { UpdateWorkspaceTaskPayload } from '@/lib/api/types';
import { getApiErrorMessage } from '@/lib/api/errorMessage';
import type { RootState } from '@/store/store';
import {
  boardSyncFailed,
  boardSyncRequested,
  boardSyncSucceeded,
  filtersUpdated,
  taskAdvanceFailed,
  taskAdvanceRequested,
  taskAdvanceSucceeded,
  taskDetailsFailed,
  taskDetailsRequested,
  taskDetailsSucceeded,
  taskEditFailed,
  taskEditRequested,
  taskEditSucceeded,
  type TaskFilter,
} from '@/features/workspace/slice/workspaceTaskBoardSlice';

const TASK_STATUS_MOVE_LABEL: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

// ─── Action creators ─────────────────────────────────────────────────────────
// These mirror workspaceTaskBoardSaga but do NOT require workspaceId in the
// initial sync. workspaceId is resolved from WorkspaceTask.workspaceId in state.

export const userTaskBoardSyncFlowRequested = createAction<{
  searchQuery?: string;
  statusFilter?: TaskFilter;
}>('userTaskBoard/syncFlowRequested');

export const userTaskAdvanceFlowRequested = createAction<{
  taskId: string;
  status: TaskStatus;
}>('userTaskBoard/advanceFlowRequested');

export const userTaskUpdateFlowRequested = createAction<{
  taskId: string;
  title: string;
  description?: string;
  status: TaskStatus;
}>('userTaskBoard/updateFlowRequested');

export const userTaskDetailsOpenFlowRequested = createAction<{
  taskId: string;
}>('userTaskBoard/detailsOpenFlowRequested');

export const userTaskDetailsRefreshFlowRequested = createAction(
  'userTaskBoard/detailsRefreshFlowRequested',
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Reads workspaceId for a task from the current board state. Returns null if not found. */
function* resolveWorkspaceId(taskId: string): Generator<unknown, string | null, unknown> {
  const tasks = (yield select(
    (state: RootState) => state.workspaceTaskBoard.tasks,
  )) as RootState['workspaceTaskBoard']['tasks'];

  return tasks.find((t) => t.id === taskId)?.workspaceId ?? null;
}

// ─── Saga handlers ────────────────────────────────────────────────────────────

function* handleUserBoardSyncFlow(
  action: { payload: { searchQuery?: string; statusFilter?: TaskFilter } },
): Generator {
  try {
    const prevSearchQuery = (yield select(
      (state: RootState) => state.workspaceTaskBoard.filters.searchQuery,
    )) as string;
    const prevStatusFilter = (yield select(
      (state: RootState) => state.workspaceTaskBoard.filters.statusFilter,
    )) as TaskFilter;

    const nextFilters = {
      searchQuery: action.payload.searchQuery ?? prevSearchQuery,
      statusFilter: action.payload.statusFilter ?? prevStatusFilter,
    };

    yield put(filtersUpdated(nextFilters));
    yield put(boardSyncRequested());

    const response = (yield call(GET_MY_TASKS, {
      page: 1,
      limit: 100,
      search:
        nextFilters.searchQuery.trim().length > 0
          ? nextFilters.searchQuery.trim()
          : undefined,
      status:
        nextFilters.statusFilter === 'ALL' ? undefined : nextFilters.statusFilter,
    })) as Awaited<ReturnType<typeof GET_MY_TASKS>>;

    yield put(
      boardSyncSucceeded({
        items: response.data.data.items,
        statusCounts: response.data.data.statusCounts,
      }),
    );
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to load your tasks');
    toast.error(message);
    yield put(boardSyncFailed(message));
  }
}

function* handleUserTaskAdvanceFlow(
  action: ReturnType<typeof userTaskAdvanceFlowRequested>,
): Generator {
  const { taskId } = action.payload;
  const workspaceId = (yield* resolveWorkspaceId(taskId)) as string | null;

  if (!workspaceId) {
    toast.error('Task not found');
    return;
  }

  try {
    yield put(taskAdvanceRequested({ taskId }));
    yield call(UPDATE_WORKSPACE_TASK, workspaceId, taskId, {
      status: action.payload.status,
    });
    toast.success(`Moved to ${TASK_STATUS_MOVE_LABEL[action.payload.status]}`);
    yield put(taskAdvanceSucceeded());
    yield put(userTaskBoardSyncFlowRequested({}));

    const detailsState = (yield select(
      (state: RootState) => state.workspaceTaskBoard.details,
    )) as RootState['workspaceTaskBoard']['details'];
    if (detailsState.open && detailsState.taskId === taskId) {
      yield put(userTaskDetailsRefreshFlowRequested());
    }
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to update task status');
    toast.error(message);
    yield put(taskAdvanceFailed(message));
  }
}

function* handleUserTaskUpdateFlow(
  action: ReturnType<typeof userTaskUpdateFlowRequested>,
): Generator {
  const { taskId } = action.payload;
  const workspaceId = (yield* resolveWorkspaceId(taskId)) as string | null;

  if (!workspaceId) {
    toast.error('Task not found');
    return;
  }

  try {
    yield put(taskEditRequested({ taskId }));

    const descriptionTrimmed = action.payload.description?.trim() ?? '';
    const patchBody: UpdateWorkspaceTaskPayload = {
      title: action.payload.title.trim(),
      status: action.payload.status,
      description: descriptionTrimmed.length > 0 ? descriptionTrimmed : null,
    };
    // Member PATCH never includes attachment fields; backend rejects them for tenant members.

    yield call(UPDATE_WORKSPACE_TASK, workspaceId, taskId, patchBody);
    toast.success('Task updated');
    yield put(taskEditSucceeded());
    yield put(userTaskBoardSyncFlowRequested({}));

    const detailsState = (yield select(
      (state: RootState) => state.workspaceTaskBoard.details,
    )) as RootState['workspaceTaskBoard']['details'];
    if (detailsState.open && detailsState.taskId === taskId) {
      yield put(userTaskDetailsRefreshFlowRequested());
    }
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to update task');
    toast.error(message);
    yield put(taskEditFailed(message));
  }
}

function* fetchUserTaskDetails(taskId: string): Generator {
  const workspaceId = (yield* resolveWorkspaceId(taskId)) as string | null;

  if (!workspaceId) {
    const message = 'Task not found';
    toast.error(message);
    yield put(taskDetailsFailed(message));
    return;
  }

  try {
    yield put(taskDetailsRequested({ taskId }));
    const response = (yield call(
      GET_WORKSPACE_TASK_DETAILS,
      workspaceId,
      taskId,
    )) as Awaited<ReturnType<typeof GET_WORKSPACE_TASK_DETAILS>>;
    yield put(taskDetailsSucceeded(response.data.data));
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to load task details');
    toast.error(message);
    yield put(taskDetailsFailed(message));
  }
}

function* handleUserTaskDetailsOpenFlow(
  action: ReturnType<typeof userTaskDetailsOpenFlowRequested>,
): Generator {
  yield* fetchUserTaskDetails(action.payload.taskId);
}

function* handleUserTaskDetailsRefreshFlow(): Generator {
  const taskId = (yield select(
    (state: RootState) => state.workspaceTaskBoard.details.taskId,
  )) as string | null;

  if (!taskId) return;
  yield* fetchUserTaskDetails(taskId);
}

export function* userTaskBoardSaga(): Generator {
  yield all([
    takeLatest(userTaskBoardSyncFlowRequested, handleUserBoardSyncFlow),
    takeLatest(userTaskAdvanceFlowRequested, handleUserTaskAdvanceFlow),
    takeLatest(userTaskUpdateFlowRequested, handleUserTaskUpdateFlow),
    takeLatest(userTaskDetailsOpenFlowRequested, handleUserTaskDetailsOpenFlow),
    takeLatest(userTaskDetailsRefreshFlowRequested, handleUserTaskDetailsRefreshFlow),
  ]);
}
