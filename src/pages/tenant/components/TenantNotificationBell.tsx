import { Bell, CheckCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GET_IN_APP_NOTIFICATIONS,
  GET_MY_TASKS,
  MARK_ALL_IN_APP_NOTIFICATIONS_READ,
  MARK_IN_APP_NOTIFICATION_READ,
  type InAppNotificationItem,
} from '@/lib/api/Api';
import { getApiErrorMessage } from '@/lib/api/errorMessage';
import { cn } from '@/lib/utils';
import {
  getNotificationsSocket,
  type InAppNotificationPushPayload,
} from '@/lib/realtime/notificationsSocket';

/** How many rows show before "Read more" reveals the rest (still capped by API fetch limit). */
const NOTIFICATION_PREVIEW_LIMIT = 5;

function isUnread(n: InAppNotificationItem): boolean {
  return n.status === 'unread' || n.status === 'pending';
}

function NotificationRowSkeleton() {
  return (
    <div className="border-border/50 w-full border-b px-3 py-2.5 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-10 rounded-full" />
      </div>
      <div className="mt-2 space-y-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="mt-2 h-3 w-28" />
    </div>
  );
}

export function TenantNotificationBell() {
  const [items, setItems] = useState<InAppNotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
    const socket = getNotificationsSocket();

    const onCreated = (payload: InAppNotificationPushPayload) => {
      setItems((prev) => {
        if (prev.some((n) => n.id === payload.id)) return prev;
        return [payload, ...prev].slice(0, 40);
      });
    };

    socket.on('notification:created', onCreated);

    return () => {
      socket.off('notification:created', onCreated);
    };
  }, [refresh]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      void refresh().finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen, refresh]);

  useEffect(() => {
    if (!isOpen) {
      setShowAllNotifications(false);
    }
  }, [isOpen]);

  const visibleItems = useMemo(() => {
    if (showAllNotifications || items.length <= NOTIFICATION_PREVIEW_LIMIT) {
      return items;
    }
    return items.slice(0, NOTIFICATION_PREVIEW_LIMIT);
  }, [items, showAllNotifications]);

  const hiddenNotificationCount = Math.max(
    0,
    items.length - NOTIFICATION_PREVIEW_LIMIT,
  );

  const unreadCount = items.filter(isUnread).length;

  const handleMarkAllRead = async (): Promise<void> => {
    try {
      setError(null);
      setItems((prev) =>
        prev.map((row) => (isUnread(row) ? { ...row, status: 'read' } : row)),
      );
      await MARK_ALL_IN_APP_NOTIFICATIONS_READ();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Unable to mark all as read'));
      // Re-sync from server to avoid UI lying.
      void refresh();
    }
  };

  const resolveWorkspaceIdForAssignedTask = async (
    taskId: string,
  ): Promise<string | null> => {
    try {
      const res = await GET_MY_TASKS({ page: 1, limit: 100 });
      const match = res.data.data.items.find((t) => t.id === taskId);
      return match?.workspaceId ?? null;
    } catch {
      return null;
    }
  };

  const handleOpenItem = async (n: InAppNotificationItem): Promise<void> => {
    try {
      const markRead = async (): Promise<void> => {
        if (!isUnread(n)) return;
        await MARK_IN_APP_NOTIFICATION_READ(n.id);
        setItems((prev) =>
          prev.map((row) =>
            row.id === n.id ? { ...row, status: 'read' } : row,
          ),
        );
      };

      if (n.type === 'task_assigned') {
        const taskIdRaw = n.metadata?.taskId;
        const workspaceIdRaw = n.metadata?.workspaceId;
        const taskId = typeof taskIdRaw === 'string' ? taskIdRaw : null;
        const workspaceIdFromMeta =
          typeof workspaceIdRaw === 'string' ? workspaceIdRaw : null;
        const workspaceId =
          workspaceIdFromMeta ??
          (taskId ? await resolveWorkspaceIdForAssignedTask(taskId) : null);
        if (taskId && workspaceId) {
          setIsOpen(false);
          navigate(
            `/tenant/workspaces/${encodeURIComponent(workspaceId)}?editTaskId=${encodeURIComponent(taskId)}`,
          );
          void markRead().catch((e: unknown) => {
            setError(getApiErrorMessage(e, 'Unable to update notification'));
          });
          return;
        }
      }

      // Default behavior: mark read (if needed) without navigation.
      await markRead();
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
          <Button
            className="h-7 px-2 text-xs enabled:cursor-pointer disabled:cursor-not-allowed"
            disabled={isLoading || unreadCount === 0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleMarkAllRead();
            }}
            type="button"
            variant="ghost"
          >
            <CheckCheck className="mr-1 size-3.5" aria-hidden />
            Mark all read
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {error !== null ? (
          <p className="text-destructive px-2 py-2 text-xs">{error}</p>
        ) : null}
        <div className="max-h-72 overflow-y-auto">
          {isLoading ? (
            <>
              <NotificationRowSkeleton />
              <NotificationRowSkeleton />
              <NotificationRowSkeleton />
            </>
          ) : null}
          {items.length === 0 && !isLoading ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">No notifications yet.</p>
          ) : null}
          {!isLoading
            ? visibleItems.map((n, idx) => (
                <button
                  className={cn(
                    'hover:bg-muted/80 border-border/50 w-full cursor-pointer border-b px-3 py-2.5 text-left text-sm last:border-b-0',
                    idx === visibleItems.length - 1 &&
                      !showAllNotifications &&
                      hiddenNotificationCount > 0 &&
                      'border-b-0',
                  )}
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
              ))
            : null}
          {!isLoading && hiddenNotificationCount > 0 && !showAllNotifications ? (
            <div className="border-border/50 border-t px-2 py-2">
              <Button
                className="text-primary h-8 w-full text-xs font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAllNotifications(true);
                }}
                type="button"
                variant="ghost"
              >
                Read more ({hiddenNotificationCount} more)
              </Button>
            </div>
          ) : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
