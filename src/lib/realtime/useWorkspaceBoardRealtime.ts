import { useEffect, useRef } from 'react';

import { workspaceTaskBoardSyncFlowRequested } from '@/features/workspace/saga/workspaceTaskBoardSaga';
import { AUTH_TOKENS_CHANGED_EVENT } from '@/lib/auth/tokenStorage';
import {
  connectWorkspaceBoardSocket,
  disconnectWorkspaceBoardSocket,
  getWorkspaceBoardSocket,
} from '@/lib/realtime/workspaceBoardSocket';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/**
 * Subscribes to workspace task-board socket events for the active workspace and
 * refetches the board (respecting current Redux filter state) when peers change tasks.
 */
export function useWorkspaceBoardRealtime(params: {
  workspaceId: string | undefined;
}): void {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.workspaceTaskBoard.filters);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    const workspaceId = params.workspaceId;
    if (!workspaceId) return;

    const socket = getWorkspaceBoardSocket();

    const onTasksChanged = (payload: { workspaceId?: string }): void => {
      if (payload?.workspaceId !== workspaceId) return;
      const f = filtersRef.current;
      dispatch(
        workspaceTaskBoardSyncFlowRequested({
          workspaceId,
          searchQuery: f.searchQuery.trim(),
          statusFilter: f.statusFilter,
        }),
      );
    };

    const doSubscribe = (): void => {
      socket.emit('workspace:subscribe', { workspaceId });
    };

    const onTokenChanged = (): void => {
      connectWorkspaceBoardSocket();
    };

    socket.on('workspace:tasks:changed', onTasksChanged);
    socket.on('connect', doSubscribe);
    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, onTokenChanged);
    connectWorkspaceBoardSocket();
    if (socket.connected) {
      doSubscribe();
    }

    return () => {
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, onTokenChanged);
      socket.off('connect', doSubscribe);
      socket.off('workspace:tasks:changed', onTasksChanged);
      if (socket.connected) {
        socket.emit('workspace:unsubscribe', { workspaceId });
      }
      disconnectWorkspaceBoardSocket();
    };
  }, [dispatch, params.workspaceId]);
}
