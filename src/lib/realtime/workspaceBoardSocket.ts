import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL } from '@/lib/api/Api';
import { getAccessToken } from '@/lib/auth/tokenStorage';

export type WorkspaceTasksChangedPayload = {
  workspaceId: string;
};

export type MemberMyTasksChangedPayload = Record<string, never>;

/** Events the server emits → client listens */
type WorkspaceBoardListenEvents = {
  'workspace:tasks:changed': (payload: WorkspaceTasksChangedPayload) => void;
  'member-tasks:changed': (payload: MemberMyTasksChangedPayload) => void;
  'workspace:ready': () => void;
};

/** Events the client emits → server handles */
type WorkspaceBoardEmitEvents = {
  'workspace:subscribe': (payload: { workspaceId: string }) => void;
  'workspace:unsubscribe': (payload: { workspaceId: string }) => void;
  'member-tasks:subscribe': () => void;
  'member-tasks:unsubscribe': () => void;
};

function resolveRealtimeOrigin(apiBaseUrl: string): string {
  return apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
}

let socketSingleton: Socket<
  WorkspaceBoardListenEvents,
  WorkspaceBoardEmitEvents
> | null = null;
let lastAuthToken: string | null = null;

export function getWorkspaceBoardSocket(): Socket<
  WorkspaceBoardListenEvents,
  WorkspaceBoardEmitEvents
> {
  if (socketSingleton) return socketSingleton;

  const token = getAccessToken() ?? undefined;
  lastAuthToken = token ?? null;
  socketSingleton = io(`${resolveRealtimeOrigin(API_BASE_URL)}/workspace`, {
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: false,
    auth: token ? { token } : undefined,
  }) as Socket<WorkspaceBoardListenEvents, WorkspaceBoardEmitEvents>;

  return socketSingleton;
}

export function connectWorkspaceBoardSocket(): void {
  const socket = getWorkspaceBoardSocket();
  const token = getAccessToken();
  socket.auth = token ? { token } : {};

  if (!socket.connected) {
    lastAuthToken = token;
    socket.connect();
    return;
  }

  if (token !== lastAuthToken) {
    lastAuthToken = token;
    socket.disconnect();
    socket.connect();
  }
}

export function disconnectWorkspaceBoardSocket(): void {
  const socket = socketSingleton;
  if (!socket) return;
  if (socket.connected) {
    socket.disconnect();
  }
  lastAuthToken = null;
}
