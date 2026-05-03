import { Ban, CheckCircle2, CircleDashed, ExternalLink, PlayCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaskStatus, WorkspaceTask } from '@/lib/api/Api';
import { AttachmentImagePreview } from './attachmentUrlPreview';
import { formatDateTime } from './taskBoard.formatters';

type TaskDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: WorkspaceTask | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

const StatusIcon = ({ status }: { status: TaskStatus }) => {
  if (status === 'TODO') {
    return <CircleDashed className="size-4 text-slate-500" aria-hidden />;
  }
  if (status === 'IN_PROGRESS') {
    return <PlayCircle className="size-4 text-amber-500" aria-hidden />;
  }
  if (status === 'BLOCKED') {
    return <Ban className="size-4 text-rose-500" aria-hidden />;
  }
  return <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />;
};

const StatusLabel = ({ status }: { status: TaskStatus }) => {
  if (status === 'TODO') {
    return 'To Do';
  }
  if (status === 'IN_PROGRESS') {
    return 'In Progress';
  }
  if (status === 'BLOCKED') {
    return 'Blocked';
  }
  return 'Done';
};

export function TaskDetailsDialog({
  open,
  onOpenChange,
  task,
  isLoading,
  error,
  onRetry,
}: TaskDetailsDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90svh] overflow-hidden p-0 sm:max-w-5xl">
        <div className="flex h-full max-h-[90svh] flex-col">
          <DialogHeader className="border-border/70 border-b px-6 py-5 sm:px-8">
            <DialogTitle className="text-2xl">Task details</DialogTitle>
            <DialogDescription>
              Full task context from workspace details endpoint.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
            {isLoading ? (
              <div aria-busy aria-label="Loading task details" className="space-y-6">
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Skeleton className="h-7 w-28 rounded-full" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <Skeleton className="h-8 w-[min(100%,28rem)] max-w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full max-w-2xl" />
                    <Skeleton className="h-4 w-full max-w-xl" />
                    <Skeleton className="h-4 w-[min(100%,20rem)]" />
                  </div>
                </section>
                <section className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </section>
                <section className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </section>
              </div>
            ) : null}

            {!isLoading && error !== null ? (
              <div className="border-destructive/40 bg-destructive/10 rounded-xl border p-4">
                <p className="text-destructive text-sm font-medium">{error}</p>
                <Button className="mt-3" onClick={onRetry} type="button" variant="outline">
                  Retry
                </Button>
              </div>
            ) : null}

            {!isLoading && error === null && task !== null ? (
              <div className="space-y-6">
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/20 px-2.5 py-1 text-xs font-medium">
                      <StatusIcon status={task.status} />
                      <StatusLabel status={task.status} />
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Updated {formatDateTime(task.updatedAt)}
                    </span>
                  </div>
                  <h3 className="text-foreground text-2xl font-semibold tracking-tight">
                    {task.title}
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
                    {task.description ?? 'No description provided.'}
                  </p>
                </section>

                <section className="grid gap-3 sm:grid-cols-2">
                  <div className="border-border/70 rounded-xl border bg-muted/10 p-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
                      Task ID
                    </p>
                    <p className="text-foreground mt-1 break-all text-xs">{task.id}</p>
                  </div>
                  <div className="border-border/70 rounded-xl border bg-muted/10 p-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
                      Created
                    </p>
                    <p className="text-foreground mt-1 text-xs">
                      {formatDateTime(task.createdAt)}
                    </p>
                  </div>
                </section>

                <section>
                  <p className="text-foreground text-sm font-semibold">Attachments</p>
                  {task.attachmentUrls.length === 0 ? (
                    <p className="text-muted-foreground mt-2 text-sm">No attachments linked.</p>
                  ) : (
                    <ul className="mt-2 space-y-3">
                      {task.attachmentUrls.map((url) => (
                        <li
                          className="border-border/70 bg-background/60 rounded-lg border px-3 py-2"
                          key={url}
                        >
                          <a
                            className="text-primary inline-flex items-center gap-1.5 break-all text-sm hover:underline"
                            href={url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {url}
                            <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                          </a>
                          <AttachmentImagePreview url={url} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
