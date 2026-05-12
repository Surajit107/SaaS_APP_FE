import {
  BotMessageSquare,
  Loader2,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  SendHorizontal,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  tenantFloatingChatBootstrapFlowRequested,
  tenantFloatingChatCreateSessionFlowRequested,
  tenantFloatingChatDeleteSessionFlowRequested,
  tenantFloatingChatSelectSessionFlowRequested,
  tenantFloatingChatSendMessageFlowRequested,
} from '@/features/tenant/saga/tenantFloatingChatSaga';
import {
  assistantRevealConsumed,
  draftRestoreConsumed,
  scopeReset,
} from '@/features/tenant/slice/tenantFloatingChatSlice';
import type { ChatMessage } from '@/lib/api/Api';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { ChatAssistantMarkdown } from '@/pages/tenant/components/ChatAssistantMarkdown';

/** Served from `frontend/public` (Vite root). */
const ASTERIQ_LOGO_SRC = '/favicon.svg';

/** Product name for the in-app AI (ties to AsterIQ). */
const ASTER_ASSISTANT_NAME = 'Aster';
const ASTERIQ_BRAND_NAME = 'AsterIQ';
const ASTER_ASSISTANT_TAGLINE = 'Ask anything';

type TypewriterState = {
  messageId: string;
  full: string;
  shown: string;
};

function TypingDots(): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1 px-0.5 py-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          className="bg-foreground/45 size-1.5 animate-bounce rounded-full"
          key={i}
          style={{ animationDelay: `${i * 160}ms`, animationDuration: '0.6s' }}
        />
      ))}
    </span>
  );
}

function AssistantThinkingRow(): React.ReactElement {
  return (
    <div
      aria-label={`${ASTER_ASSISTANT_NAME} is thinking`}
      aria-live="polite"
      className="text-foreground mr-auto flex max-w-[min(100%,20rem)] items-center gap-1.5 py-1"
      role="status"
    >
      <span className="ring-border flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1">
        <img
          alt=""
          className="size-[1.125rem] object-contain"
          decoding="async"
          height={18}
          src={ASTERIQ_LOGO_SRC}
          width={18}
        />
      </span>
      <TypingDots />
    </div>
  );
}

function formatSessionListTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfMsg) / 86400000);
  if (dayDiff === 0) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  if (dayDiff === 1) {
    return 'Yesterday';
  }
  if (dayDiff > 1 && dayDiff < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Global floating assistant for authenticated tenant routes (not a dedicated page).
 */
export function TenantFloatingChat(): React.ReactElement {
  const dispatch = useAppDispatch();
  const {
    allowed,
    sessions,
    activeSessionId,
    messages,
    isBootstrapping,
    isSending,
    isCreatingSession,
    deletingSessionId,
    error,
    draftRestore,
    assistantRevealSeed,
  } = useAppSelector((s) => s.tenantFloatingChat);

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [typewriter, setTypewriter] = useState<TypewriterState | null>(null);
  const [isSessionsRailOpen, setIsSessionsRailOpen] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(min-width: 768px)').matches;
  });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevDeletingSessionId = useRef<string | null>(null);

  const scrollToBottom = useCallback((): void => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    return () => {
      dispatch(scopeReset());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    dispatch(tenantFloatingChatBootstrapFlowRequested());
  }, [dispatch, isOpen]);

  useEffect(() => {
    if (draftRestore === null) {
      return;
    }
    setDraft(draftRestore);
    dispatch(draftRestoreConsumed());
  }, [dispatch, draftRestore]);

  useEffect(() => {
    if (assistantRevealSeed === null) {
      return;
    }
    setTypewriter({
      messageId: assistantRevealSeed.messageId,
      full: assistantRevealSeed.full,
      shown: '',
    });
    dispatch(assistantRevealConsumed());
  }, [assistantRevealSeed, dispatch]);

  useEffect(() => {
    const prev = prevDeletingSessionId.current;
    prevDeletingSessionId.current = deletingSessionId;
    if (prev !== null && deletingSessionId === null) {
      setDeleteTargetId((id) => (id === prev ? null : id));
    }
  }, [deletingSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom, typewriter, isSending]);

  useEffect(() => {
    if (typewriter === null) {
      return undefined;
    }
    if (typewriter.shown.length >= typewriter.full.length) {
      setTypewriter(null);
      return undefined;
    }
    const step = typewriter.full.length > 800 ? 4 : typewriter.full.length > 200 ? 2 : 1;
    const id = window.setTimeout(() => {
      setTypewriter((tw) => {
        if (tw === null) {
          return null;
        }
        const nextLen = Math.min(tw.shown.length + step, tw.full.length);
        return { ...tw, shown: tw.full.slice(0, nextLen) };
      });
    }, 16);
    return () => window.clearTimeout(id);
  }, [typewriter]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const selectSession = (sessionId: string): void => {
    setTypewriter(null);
    dispatch(tenantFloatingChatSelectSessionFlowRequested({ sessionId }));
  };

  const handleNewSession = (): void => {
    setTypewriter(null);
    dispatch(tenantFloatingChatCreateSessionFlowRequested());
  };

  const performDeleteSession = (): void => {
    if (deleteTargetId === null) {
      return;
    }
    setTypewriter(null);
    dispatch(tenantFloatingChatDeleteSessionFlowRequested({ sessionId: deleteTargetId }));
  };

  const handleSend = (): void => {
    if (activeSessionId === null || draft.trim().length === 0 || isSending) {
      return;
    }
    const text = draft.trim();
    setDraft('');
    dispatch(tenantFloatingChatSendMessageFlowRequested({ content: text }));
  };

  const displayAssistantContent = (m: ChatMessage): string => {
    if (m.role !== 'assistant') {
      return m.content;
    }
    if (typewriter !== null && typewriter.messageId === m.id) {
      return typewriter.shown;
    }
    return m.content;
  };

  const showAssistantMeta = (m: ChatMessage): boolean => {
    if (m.role !== 'assistant') {
      return false;
    }
    if (typewriter !== null && typewriter.messageId === m.id) {
      return typewriter.shown.length >= typewriter.full.length;
    }
    return true;
  };

  const isDeletingSession = deletingSessionId !== null;

  return (
    <>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !isDeletingSession) {
            setDeleteTargetId(null);
          }
        }}
        open={deleteTargetId !== null}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the conversation and its messages. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingSession} type="button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingSession}
              onClick={(e) => {
                e.preventDefault();
                performDeleteSession();
              }}
              type="button"
            >
              {isDeletingSession ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Deleting…
                </span>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed right-4 bottom-6 z-50 sm:right-6" data-floating-chat-root>
        <Button
          aria-expanded={isOpen}
          aria-controls="tenant-floating-chat-panel"
          aria-label={
            isOpen ? `Close ${ASTER_ASSISTANT_NAME}` : `Open ${ASTER_ASSISTANT_NAME}`
          }
          className={cn(
            'size-12 rounded-full shadow-xl ring-4 ring-background transition-[transform,box-shadow] duration-200',
            'hover:-translate-y-0.5 hover:shadow-2xl',
            isOpen ? 'shadow-primary/25' : 'shadow-black/10 dark:shadow-black/40',
          )}
          onClick={() => setIsOpen((o) => !o)}
          size="icon"
          type="button"
          variant="default"
        >
          {isOpen ? (
            <X aria-hidden className="size-5" />
          ) : (
            <BotMessageSquare
              aria-hidden
              className="size-[1.375rem] shrink-0 text-primary-foreground"
              strokeWidth={1.85}
            />
          )}
        </Button>
      </div>

      {isOpen ? (
        <div
          className="border-border/80 bg-background supports-backdrop-filter:backdrop-blur-md fixed right-4 bottom-20 z-50 flex max-h-[min(68dvh,calc(100dvh-6rem))] w-[min(100vw-1.25rem,520px)] flex-col overflow-hidden rounded-xl border shadow-2xl sm:right-6"
          id="tenant-floating-chat-panel"
          role="dialog"
          aria-label={`${ASTER_ASSISTANT_NAME}, ${ASTERIQ_BRAND_NAME} assistant`}
        >
          <div className="border-border/60 bg-muted/15 flex shrink-0 items-center justify-between gap-2 border-b px-2.5 py-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="bg-background ring-border flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md ring-1">
                <img
                  alt=""
                  className="size-6 object-contain"
                  decoding="async"
                  height={24}
                  src={ASTERIQ_LOGO_SRC}
                  width={24}
                />
              </span>
              <div className="min-w-0">
                <p className="text-foreground truncate text-xs font-semibold">{ASTER_ASSISTANT_NAME}</p>
                <p className="text-muted-foreground truncate text-[0.65rem]">{ASTER_ASSISTANT_TAGLINE}</p>
              </div>
            </div>
            <Button
              aria-label={`Close ${ASTER_ASSISTANT_NAME}`}
              className="size-8 shrink-0 rounded-md"
              onClick={() => setIsOpen(false)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden className="size-3.5" />
            </Button>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {isBootstrapping ? (
              <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 py-16">
                <div className="flex items-center">
                  <TypingDots />
                </div>
                <p className="text-xs">Connecting…</p>
              </div>
            ) : allowed !== true ? (
              <div className="flex-1 overflow-y-auto p-3">
                <Card className="border-border/60 shadow-none">
                  <CardHeader className="space-y-1 p-4 pb-2">
                    <CardTitle className="text-base">Unlock {ASTER_ASSISTANT_NAME}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {ASTER_ASSISTANT_NAME} is included with Pro and Enterprise—get quick, contextual
                      help without leaving your workspace. Your current plan does not include it yet; upgrade
                      to give your team a smarter way to work.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {error !== null ? (
                      <p className="text-destructive bg-destructive/5 rounded-md border border-destructive/20 px-2 py-1.5 text-xs">
                        {error}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        If you cannot change billing yourself, ask your organization administrator to review
                        your plan. Admins: open <strong className="text-foreground">Manage subscription</strong>{' '}
                        from the tenant menu.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-row">
                {/* ChatGPT-style conversation sidebar */}
                <aside
                  className={cn(
                    'flex shrink-0 flex-col border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out',
                    'border-r',
                    isSessionsRailOpen ? 'w-[min(100%,168px)]' : 'w-11',
                  )}
                  id="tenant-chat-rail"
                >
                  {isSessionsRailOpen ? (
                    <>
                      <div className="flex flex-col gap-1.5 p-1.5">
                        <Button
                          aria-controls="tenant-chat-rail"
                          aria-label="Close sidebar"
                          className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8 shrink-0 rounded-md"
                          onClick={() => setIsSessionsRailOpen(false)}
                          size="icon"
                          title="Close sidebar"
                          type="button"
                          variant="ghost"
                        >
                          <PanelLeftClose aria-hidden className="size-4" />
                        </Button>
                        <button
                          className={cn(
                            'border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/90',
                            'flex w-full items-center gap-1.5 rounded-md border bg-transparent px-2 py-2 text-left text-xs font-medium transition-colors',
                            'disabled:pointer-events-none disabled:opacity-50',
                          )}
                          disabled={isCreatingSession}
                          onClick={handleNewSession}
                          type="button"
                        >
                          {isCreatingSession ? (
                            <Loader2 aria-hidden className="size-3.5 shrink-0 animate-spin" />
                          ) : (
                            <SquarePen aria-hidden className="size-3.5 shrink-0" />
                          )}
                          <span className="truncate">New chat</span>
                        </button>
                      </div>
                      <div className="text-sidebar-foreground/55 px-2 pb-1 pt-0 text-[10px] font-semibold tracking-wide uppercase">
                        Your chats
                      </div>
                      <div
                        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 pb-2"
                        id="tenant-chat-sessions-list"
                      >
                        {sessions.map((s) => {
                          const active = s.id === activeSessionId;
                          return (
                            <div className="group relative" key={s.id}>
                              <button
                                className={cn(
                                  'w-full rounded-md py-2 pr-9 pl-2 text-left text-xs transition-colors',
                                  active
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                    : 'text-sidebar-foreground/90 hover:bg-sidebar-accent/70',
                                )}
                                onClick={() => {
                                  selectSession(s.id);
                                }}
                                type="button"
                              >
                                <span className="line-clamp-1 font-normal">{s.title}</span>
                                <span className="text-sidebar-foreground/50 mt-0.5 block text-[10px] tabular-nums">
                                  {formatSessionListTime(s.updatedAt)}
                                </span>
                              </button>
                              <Button
                                aria-label={`Delete chat: ${s.title}`}
                                className={cn(
                                  'text-sidebar-foreground/60 hover:text-destructive absolute top-1/2 right-0.5 size-7 -translate-y-1/2 rounded-md',
                                  'opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100',
                                )}
                                disabled={isDeletingSession}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDeleteTargetId(s.id);
                                }}
                                size="icon"
                                title="Delete chat"
                                type="button"
                                variant="ghost"
                              >
                                <Trash2 aria-hidden className="size-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 flex-col items-center gap-1.5 p-1.5">
                      <Button
                        aria-controls="tenant-chat-rail"
                        aria-label={`Open sidebar, ${sessions.length} conversations`}
                        className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8 shrink-0 rounded-md"
                        onClick={() => setIsSessionsRailOpen(true)}
                        size="icon"
                        title="Open sidebar"
                        type="button"
                        variant="ghost"
                      >
                        <PanelLeftOpen aria-hidden className="size-4" />
                      </Button>
                      <Button
                        className="h-8 w-8 shrink-0 rounded-md"
                        disabled={isCreatingSession}
                        onClick={handleNewSession}
                        size="icon"
                        title="New chat"
                        type="button"
                        variant="outline"
                      >
                        {isCreatingSession ? (
                          <Loader2 aria-hidden className="size-3.5 animate-spin" />
                        ) : (
                          <MessageSquarePlus aria-hidden className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </aside>

                {/* Main thread + ChatGPT-style composer */}
                <div className="bg-background flex min-h-0 min-w-0 flex-1 flex-col">
                  <div
                    className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                    ref={scrollRef}
                  >
                    <div className="mx-auto flex w-full max-w-xl flex-col gap-2.5 px-2.5 py-3 sm:px-3">
                      {error !== null ? (
                        <p className="text-destructive bg-destructive/5 rounded-xl border border-destructive/20 px-3 py-2 text-xs">
                          {error}
                        </p>
                      ) : null}
                      {messages.length === 0 && !isSending ? (
                        <div className="text-muted-foreground flex flex-col items-center justify-center gap-0.5 py-6 text-center sm:py-8">
                          <p className="text-foreground text-sm font-medium sm:text-base">
                            How can I help?
                          </p>
                          <p className="max-w-[14rem] text-[0.65rem] leading-relaxed sm:max-w-xs sm:text-xs">
                            Ask {ASTER_ASSISTANT_NAME} anything about your workspace. Enter sends,
                            Shift+Enter adds a line.
                          </p>
                        </div>
                      ) : (
                        messages.map((m) => (
                          <div
                            className={cn(
                              'flex w-full flex-col gap-1',
                              m.role === 'user' ? 'items-end' : 'items-start',
                            )}
                            key={m.id}
                          >
                            <div
                              className={cn(
                                'max-w-[min(100%,85%)] text-xs leading-relaxed',
                                m.role === 'user'
                                  ? 'bg-secondary text-secondary-foreground rounded-2xl px-3 py-2'
                                  : 'text-foreground rounded-xl bg-muted/60 px-3 py-2 dark:bg-white/[0.06]',
                              )}
                            >
                              {m.role === 'user' ? (
                                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                              ) : typewriter !== null &&
                                typewriter.messageId === m.id &&
                                typewriter.shown.length < typewriter.full.length ? (
                                <p className="whitespace-pre-wrap break-words">
                                  {displayAssistantContent(m)}
                                  <span className="bg-foreground/80 ml-0.5 inline-block h-3.5 w-px animate-pulse align-middle" />
                                </p>
                              ) : (
                                <ChatAssistantMarkdown content={displayAssistantContent(m)} />
                              )}
                              {showAssistantMeta(m) &&
                              (m.provider !== undefined || m.model !== undefined) ? (
                                <p className="text-muted-foreground mt-1.5 font-mono text-[0.65rem]">
                                  {[m.provider, m.model].filter(Boolean).join(' · ')}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ))
                      )}
                      {isSending ? <AssistantThinkingRow /> : null}
                    </div>
                  </div>

                  <div className="shrink-0 border-border/50 bg-gradient-to-t from-transparent via-background to-background px-2.5 pt-1.5 pb-2 sm:px-3">
                    <div className="mx-auto w-full max-w-xl">
                      <div className="border-border/70 dark:border-white/[0.12] flex min-h-[44px] items-end gap-1.5 rounded-2xl border bg-muted/50 px-1.5 py-1.5 shadow-sm dark:bg-[oklch(0.24_0_0)]">
                        <textarea
                          className={cn(
                            'placeholder:text-muted-foreground max-h-[min(140px,28dvh)] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-xs leading-snug outline-none',
                            'disabled:opacity-50',
                          )}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                          placeholder={`Message ${ASTER_ASSISTANT_NAME}…`}
                          rows={1}
                          value={draft}
                        />
                        <Button
                          aria-label="Send message"
                          className="mb-px size-8 shrink-0 rounded-full"
                          disabled={isSending || draft.trim().length === 0 || activeSessionId === null}
                          onClick={handleSend}
                          size="icon"
                          type="button"
                        >
                          {isSending ? (
                            <Loader2 aria-hidden className="size-3.5 animate-spin" />
                          ) : (
                            <SendHorizontal aria-hidden className="size-3.5" />
                          )}
                        </Button>
                      </div>
                      <p className="text-muted-foreground mt-1.5 text-center text-[10px] leading-tight">
                        {ASTER_ASSISTANT_NAME} can make mistakes. Verify important information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
