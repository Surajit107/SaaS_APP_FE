import { useEffect, useState } from 'react';

import {
  connectNotificationsSocket,
  disconnectNotificationsSocket,
} from '@/lib/realtime/notificationsSocket';
import {
  AUTH_TOKENS_CHANGED_EVENT,
  getAccessToken,
} from '@/lib/auth/tokenStorage';

export function useNotificationsSocketConnection(params: {
  enabled: boolean;
}): void {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getAccessToken(),
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'accessToken') return;
      setAccessToken(getAccessToken());
    };
    const onAuthTokensChanged = () => {
      setAccessToken(getAccessToken());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, onAuthTokensChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, onAuthTokensChanged);
    };
  }, []);

  useEffect(() => {
    if (!params.enabled || accessToken === null) {
      disconnectNotificationsSocket();
      return;
    }
    connectNotificationsSocket();
    return () => {
      disconnectNotificationsSocket();
    };
  }, [params.enabled, accessToken]);
}
