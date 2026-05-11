import { useEffect } from 'react';

import { userTaskBoardSyncFlowRequested } from '@/features/workspace/saga/userTaskBoardSaga';
import { AUTH_TOKENS_CHANGED_EVENT } from '@/lib/auth/tokenStorage';
import {
  connectWorkspaceBoardSocket,
  disconnectWorkspaceBoardSocket,
  getWorkspaceBoardSocket,
} from '@/lib/realtime/workspaceBoardSocket';
import { useAppDispatch } from '@/store/hooks';

/**
 * When enabled, subscribes the authenticated user to assignee inbox updates so
 * “My tasks” refetches when status (or other fields) change from the workspace board
 * or another client.
 */
export function useMemberMyTasksRealtime(params: { enabled: boolean }): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!params.enabled) return;

    const socket = getWorkspaceBoardSocket();

    const onInboxChanged = (): void => {
      dispatch(userTaskBoardSyncFlowRequested({}));
    };

    const doSubscribe = (): void => {
      socket.emit('member-tasks:subscribe');
    };

    const onTokenChanged = (): void => {
      connectWorkspaceBoardSocket();
    };

    socket.on('member-tasks:changed', onInboxChanged);
    socket.on('connect', doSubscribe);
    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, onTokenChanged);
    connectWorkspaceBoardSocket();
    if (socket.connected) {
      doSubscribe();
    }

    return () => {
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, onTokenChanged);
      socket.off('connect', doSubscribe);
      socket.off('member-tasks:changed', onInboxChanged);
      if (socket.connected) {
        socket.emit('member-tasks:unsubscribe');
      }
      disconnectWorkspaceBoardSocket();
    };
  }, [dispatch, params.enabled]);
}
