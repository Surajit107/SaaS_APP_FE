import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL } from '@/lib/api/Api';
import { getAccessToken } from '@/lib/auth/tokenStorage';

type NotificationsServerEvents = {
  'notification:created': (payload: InAppNotificationPushPayload) => void;
  'notifications:ready': () => void;
};

type InAppNotificationPushPayload = {
  id: string;
  type: string;
  title: string;
  body?: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

function resolveRealtimeOrigin(apiBaseUrl: string): string {
  // API base URL is expected to include `/api`. Socket.IO server is mounted at the same origin.
  return apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
}

let socketSingleton: Socket<NotificationsServerEvents> | null = null;
let lastAuthToken: string | null = null;

export function getNotificationsSocket(): Socket<NotificationsServerEvents> {
  if (socketSingleton) return socketSingleton;

  const token = getAccessToken() ?? undefined;
  lastAuthToken = token ?? null;
  socketSingleton = io(`${resolveRealtimeOrigin(API_BASE_URL)}/notifications`, {
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: false,
    auth: token ? { token } : undefined,
  });

  return socketSingleton;
}

export function connectNotificationsSocket(): void {
  const socket = getNotificationsSocket();
  const token = getAccessToken();

  // Ensure next connect (or reconnect) uses the freshest access token.
  socket.auth = token ? { token } : {};

  if (!socket.connected) {
    lastAuthToken = token;
    socket.connect();
    return;
  }

  // Token rotated (refresh/login) while connected → reconnect so server re-authenticates.
  if (token !== lastAuthToken) {
    lastAuthToken = token;
    socket.disconnect();
    socket.connect();
  }
}

export function disconnectNotificationsSocket(): void {
  const socket = socketSingleton;
  if (!socket) return;
  if (socket.connected) {
    socket.disconnect();
  }
  lastAuthToken = null;
}

export type { InAppNotificationPushPayload };
