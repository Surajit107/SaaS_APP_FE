import { createAction } from '@reduxjs/toolkit';
import { all, call, put, takeLatest } from 'redux-saga/effects';
import { toast } from 'sonner';

import {
  CREATE_WORKSPACE,
  DELETE_WORKSPACE,
  GET_WORKSPACES,
} from '@/lib/api/Api';
import { getApiErrorMessage } from '@/lib/api/errorMessage';
import {
  createFailed,
  createRequested,
  createSucceeded,
  deleteFailed,
  deleteRequested,
  deleteSucceeded,
  syncFailed,
  syncRequested,
  syncSucceeded,
} from '@/features/workspace/slice/workspaceSlice';

export const workspaceSyncFlowRequested = createAction(
  'workspace/syncFlowRequested',
);

export const workspaceCreateFlowRequested = createAction<{ name: string }>(
  'workspace/createFlowRequested',
);

export const workspaceDeleteFlowRequested = createAction<{ workspaceId: string }>(
  'workspace/deleteFlowRequested',
);

function* handleSyncFlow(): Generator {
  try {
    yield put(syncRequested());
    const response = (yield call(
      GET_WORKSPACES,
    )) as Awaited<ReturnType<typeof GET_WORKSPACES>>;
    yield put(syncSucceeded(response.data.data));
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to load workspaces');
    toast.error(message);
    yield put(syncFailed(message));
  }
}

function* handleCreateFlow(
  action: ReturnType<typeof workspaceCreateFlowRequested>,
): Generator {
  try {
    yield put(createRequested());
    const response = (yield call(
      CREATE_WORKSPACE,
      { name: action.payload.name.trim() },
    )) as Awaited<ReturnType<typeof CREATE_WORKSPACE>>;
    yield put(createSucceeded(response.data.data));
    toast.success('Workspace created');
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to create workspace');
    toast.error(message);
    yield put(createFailed(message));
  }
}

function* handleDeleteFlow(
  action: ReturnType<typeof workspaceDeleteFlowRequested>,
): Generator {
  const { workspaceId } = action.payload;
  try {
    yield put(deleteRequested(workspaceId));
    yield call(DELETE_WORKSPACE, workspaceId);
    yield put(deleteSucceeded(workspaceId));
    toast.success('Workspace deleted');
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to delete workspace');
    toast.error(message);
    yield put(deleteFailed(message));
  }
}

export function* workspaceSaga(): Generator {
  yield all([
    takeLatest(workspaceSyncFlowRequested, handleSyncFlow),
    takeLatest(workspaceCreateFlowRequested, handleCreateFlow),
    takeLatest(workspaceDeleteFlowRequested, handleDeleteFlow),
  ]);
}
