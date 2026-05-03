import { Bell, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GET_IN_APP_NOTIFICATIONS,
  MARK_IN_APP_NOTIFICATION_READ,
  type InAppNotificationItem,
} from '@/lib/api/Api';
import { getApiErrorMessage } from '@/lib/api/errorMessage';

const POLL_MS = 60_000;

function isUnread(n: InAppNotificationItem): boolean {
  return n.status === 'unread' || n.status === 'pending';
}

export function TenantNotificationBell() {
  const [items, setItems] = useState<InAppNotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const res = await GET_IN_APP_NOTIFICATIONS(40);
      setItems(res.data.data);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Unable to load notifications'));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      void refresh().finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen, refresh]);

  const unreadCount = items.filter(isUnread).length;

  const handleOpenItem = async (n: InAppNotificationItem): Promise<void> => {
    if (!isUnread(n)) {
      return;
    }
    try {
      await MARK_IN_APP_NOTIFICATION_READ(n.id);
      setItems((prev) =>
        prev.map((row) =>
          row.id === n.id ? { ...row, status: 'read' } : row,
        ),
      );
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Unable to update notification'));
    }
  };

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          className="relative size-9 shrink-0"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Bell className="size-4" aria-hidden />
          {unreadCount > 0 ? (
            <span className="bg-destructive text-destructive-foreground absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          {isLoading ? <Loader2 className="text-muted-foreground size-4 animate-spin" aria-hidden /> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {error !== null ? (
          <p className="text-destructive px-2 py-2 text-xs">{error}</p>
        ) : null}
        <div className="max-h-72 overflow-y-auto">
          {items.length === 0 && !isLoading ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">No notifications yet.</p>
          ) : null}
          {items.map((n) => (
            <button
              className="hover:bg-muted/80 border-border/50 w-full border-b px-3 py-2.5 text-left text-sm last:border-b-0"
              key={n.id}
              onClick={() => {
                void handleOpenItem(n);
              }}
              type="button"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-foreground font-medium leading-snug">{n.title}</span>
                {isUnread(n) ? (
                  <span className="bg-primary/15 text-primary shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase">
                    New
                  </span>
                ) : null}
              </div>
              {n.body !== undefined && n.body.length > 0 ? (
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{n.body}</p>
              ) : null}
              <p className="text-muted-foreground mt-1 text-[10px] tabular-nums">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
