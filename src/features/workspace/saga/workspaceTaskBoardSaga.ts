import { createAction } from '@reduxjs/toolkit';
import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import { toast } from 'sonner';

import {
  CREATE_WORKSPACE_TASK,
  DELETE_WORKSPACE_TASK,
  GET_WORKSPACE_TASK_DETAILS,
  GET_WORKSPACE_TASKS,
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
  taskCreateFailed,
  taskCreateRequested,
  taskCreateSucceeded,
  taskDeleteFailed,
  taskDeleteRequested,
  taskDeleteSucceeded,
  taskDetailsClosed,
  taskDetailsFailed,
  taskDetailsRequested,
  taskDetailsSucceeded,
  taskEditFailed,
  taskEditRequested,
  taskEditSucceeded,
  workspaceActivated,
  type TaskFilter,
} from '@/features/workspace/slice/workspaceTaskBoardSlice';

const TASK_STATUS_MOVE_LABEL: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

// ─── Action creators ─────────────────────────────────────────────────────────

export const workspaceTaskBoardSyncFlowRequested = createAction<{
  workspaceId: string;
  searchQuery?: string;
  statusFilter?: TaskFilter;
}>('workspaceTaskBoard/syncFlowRequested');

export const workspaceTaskCreateFlowRequested = createAction<{
  workspaceId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  tempAttachmentPublicIds: string[];
  assignedTo?: string;
}>('workspaceTaskBoard/createFlowRequested');

export const workspaceTaskAdvanceFlowRequested = createAction<{
  workspaceId: string;
  taskId: string;
  status: TaskStatus;
}>('workspaceTaskBoard/advanceFlowRequested');

export const workspaceTaskUpdateFlowRequested = createAction<{
  workspaceId: string;
  taskId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  attachmentUrls: string[];
  /** When true, PATCH omits attachment fields (assignee / member-safe updates). */
  omitAttachments?: boolean;
  /**
   * When this key is present, PATCH updates assignee (null clears).
   * Omit entirely for member updates — backend forbids reassignment for members.
   */
  assignedTo?: string | null;
}>('workspaceTaskBoard/updateFlowRequested');

export const workspaceTaskDeleteFlowRequested = createAction<{
  workspaceId: string;
  taskId: string;
}>('workspaceTaskBoard/deleteFlowRequested');

export const workspaceTaskDetailsOpenFlowRequested = createAction<{
  workspaceId: string;
  taskId: string;
}>('workspaceTaskBoard/detailsOpenFlowRequested');

export const workspaceTaskDetailsRefreshFlowRequested = createAction(
  'workspaceTaskBoard/detailsRefreshFlowRequested',
);

// ─── Saga handlers ────────────────────────────────────────────────────────────

function* handleBoardSyncFlow(
  action: ReturnType<typeof workspaceTaskBoardSyncFlowRequested>,
): Generator {
  const { workspaceId } = action.payload;

  try {
    yield put(workspaceActivated(workspaceId));

    const previousFilters = (yield select(
      (state: RootState) => state.workspaceTaskBoard.filters,
    )) as RootState['workspaceTaskBoard']['filters'];

    const nextFilters = {
      searchQuery: action.payload.searchQuery ?? previousFilters.searchQuery,
      statusFilter: action.payload.statusFilter ?? previousFilters.statusFilter,
    };

    yield put(filtersUpdated(nextFilters));
    yield put(boardSyncRequested());

    const response = (yield call(GET_WORKSPACE_TASKS, workspaceId, {
      page: 1,
      limit: 50,
      search:
        nextFilters.searchQuery.trim().length > 0
          ? nextFilters.searchQuery.trim()
          : undefined,
      status:
        nextFilters.statusFilter === 'ALL' ? undefined : nextFilters.statusFilter,
    })) as Awaited<ReturnType<typeof GET_WORKSPACE_TASKS>>;

    yield put(
      boardSyncSucceeded({
        items: response.data.data.items,
        statusCounts: response.data.data.statusCounts,
      }),
    );
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to load workspace tasks');
    toast.error(message);
    yield put(boardSyncFailed(message));
  }
}

function* handleTaskCreateFlow(
  action: ReturnType<typeof workspaceTaskCreateFlowRequested>,
): Generator {
  const { workspaceId } = action.payload;
  try {
    yield put(taskCreateRequested());
    yield call(CREATE_WORKSPACE_TASK, workspaceId, {
      title: action.payload.title,
      description: action.payload.description,
      status: action.payload.status,
      tempAttachmentPublicIds: action.payload.tempAttachmentPublicIds,
      ...(action.payload.assignedTo !== undefined && action.payload.assignedTo.length > 0
        ? { assignedTo: action.payload.assignedTo }
        : {}),
    });
    toast.success('Task created');
    yield put(taskCreateSucceeded());
    yield put(workspaceTaskBoardSyncFlowRequested({ workspaceId }));
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to create task');
    toast.error(message);
    yield put(taskCreateFailed(message));
  }
}

function* handleTaskUpdateFlow(
  action: ReturnType<typeof workspaceTaskUpdateFlowRequested>,
): Generator {
  const { workspaceId, taskId } = action.payload;
  try {
    yield put(taskEditRequested({ taskId }));
    const descriptionTrimmed = action.payload.description?.trim() ?? '';
    const patchBody: UpdateWorkspaceTaskPayload = {
      title: action.payload.title.trim(),
      status: action.payload.status,
      description: descriptionTrimmed.length > 0 ? descriptionTrimmed : null,
    };
    if (action.payload.omitAttachments !== true) {
      patchBody.attachmentUrls = action.payload.attachmentUrls;
    }
    if (Object.hasOwn(action.payload, 'assignedTo')) {
      patchBody.assignedTo = action.payload.assignedTo ?? null;
    }
    yield call(UPDATE_WORKSPACE_TASK, workspaceId, taskId, patchBody);
    toast.success('Task updated');
    yield put(taskEditSucceeded());
    yield put(workspaceTaskBoardSyncFlowRequested({ workspaceId }));

    const detailsState = (yield select(
      (state: RootState) => state.workspaceTaskBoard.details,
    )) as RootState['workspaceTaskBoard']['details'];
    if (detailsState.open && detailsState.taskId === taskId) {
      yield put(workspaceTaskDetailsRefreshFlowRequested());
    }
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to update task');
    toast.error(message);
    yield put(taskEditFailed(message));
  }
}

function* handleTaskDeleteFlow(
  action: ReturnType<typeof workspaceTaskDeleteFlowRequested>,
): Generator {
  const { workspaceId, taskId } = action.payload;
  try {
    yield put(taskDeleteRequested({ taskId }));
    yield call(DELETE_WORKSPACE_TASK, workspaceId, taskId);
    toast.success('Task deleted');
    yield put(taskDeleteSucceeded());

    const detailsState = (yield select(
      (state: RootState) => state.workspaceTaskBoard.details,
    )) as RootState['workspaceTaskBoard']['details'];
    if (detailsState.open && detailsState.taskId === taskId) {
      yield put(taskDetailsClosed());
    }

    yield put(workspaceTaskBoardSyncFlowRequested({ workspaceId }));
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to delete task');
    toast.error(message);
    yield put(taskDeleteFailed(message));
  }
}

function* handleTaskAdvanceFlow(
  action: ReturnType<typeof workspaceTaskAdvanceFlowRequested>,
): Generator {
  const { workspaceId, taskId } = action.payload;
  try {
    yield put(taskAdvanceRequested({ taskId }));
    yield call(UPDATE_WORKSPACE_TASK, workspaceId, taskId, { status: action.payload.status });
    toast.success(`Moved to ${TASK_STATUS_MOVE_LABEL[action.payload.status]}`);
    yield put(taskAdvanceSucceeded());
    yield put(workspaceTaskBoardSyncFlowRequested({ workspaceId }));

    const detailsState = (yield select(
      (state: RootState) => state.workspaceTaskBoard.details,
    )) as RootState['workspaceTaskBoard']['details'];
    if (detailsState.open && detailsState.taskId === taskId) {
      yield put(workspaceTaskDetailsRefreshFlowRequested());
    }
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to update task status');
    toast.error(message);
    yield put(taskAdvanceFailed(message));
  }
}

function* fetchTaskDetails(workspaceId: string, taskId: string): Generator {
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

function* handleTaskDetailsOpenFlow(
  action: ReturnType<typeof workspaceTaskDetailsOpenFlowRequested>,
): Generator {
  yield* fetchTaskDetails(action.payload.workspaceId, action.payload.taskId);
}

function* handleTaskDetailsRefreshFlow(): Generator {
  const activeWorkspaceId = (yield select(
    (state: RootState) => state.workspaceTaskBoard.activeWorkspaceId,
  )) as string | null;
  const taskId = (yield select(
    (state: RootState) => state.workspaceTaskBoard.details.taskId,
  )) as string | null;

  if (!activeWorkspaceId || !taskId) {
    return;
  }
  yield* fetchTaskDetails(activeWorkspaceId, taskId);
}

export function* workspaceTaskBoardSaga(): Generator {
  yield all([
    takeLatest(workspaceTaskBoardSyncFlowRequested, handleBoardSyncFlow),
    takeLatest(workspaceTaskCreateFlowRequested, handleTaskCreateFlow),
    takeLatest(workspaceTaskUpdateFlowRequested, handleTaskUpdateFlow),
    takeLatest(workspaceTaskDeleteFlowRequested, handleTaskDeleteFlow),
    takeLatest(workspaceTaskAdvanceFlowRequested, handleTaskAdvanceFlow),
    takeLatest(workspaceTaskDetailsOpenFlowRequested, handleTaskDetailsOpenFlow),
    takeLatest(workspaceTaskDetailsRefreshFlowRequested, handleTaskDetailsRefreshFlow),
  ]);
}
