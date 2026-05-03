import {
  useCallback,
  useEffect,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import {
  Ban,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Pencil,
  PlayCircle,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaskStatus, WorkspaceTask } from '@/lib/api/Api';
import { cn } from '@/lib/utils';
import { BOARD_COLUMNS } from './taskBoard.constants';

const TASK_DRAG_MIME = 'application/x-workspace-task-id';

const COLUMN_SKELETON_CARD_COUNT = 3;

const COLUMN_TOP_ACCENT: Record<TaskStatus, string> = {
  TODO: 'border-t-slate-500/85 dark:border-t-slate-400/70',
  IN_PROGRESS: 'border-t-amber-500/90',
  BLOCKED: 'border-t-rose-500/85',
  DONE: 'border-t-emerald-500/85',
};

const COLUMN_ICON_CLASS: Record<TaskStatus, string> = {
  TODO: 'text-slate-500 dark:text-slate-400',
  IN_PROGRESS: 'text-amber-500',
  BLOCKED: 'text-rose-500',
  DONE: 'text-emerald-600 dark:text-emerald-400',
};

function ColumnStatusIcon({ status }: { status: TaskStatus }) {
  const className = cn('size-3.5 shrink-0', COLUMN_ICON_CLASS[status]);
  if (status === 'TODO') {
    return <CircleDashed className={className} aria-hidden />;
  }
  if (status === 'IN_PROGRESS') {
    return <PlayCircle className={className} aria-hidden />;
  }
  if (status === 'BLOCKED') {
    return <Ban className={className} aria-hidden />;
  }
  return <CheckCircle2 className={className} aria-hidden />;
}

function TaskCardSkeleton() {
  return (
    <div
      aria-hidden
      className="border-border/50 bg-background/70 space-y-2 rounded-md border px-2 py-1.5"
    >
      <div className="flex items-start gap-1.5">
        <Skeleton className="h-3.5 min-w-0 flex-1 rounded" />
        <Skeleton className="size-6 shrink-0 rounded" />
      </div>
    </div>
  );
}

type TaskBoardColumnsProps = {
  tasksByStatus: Record<TaskStatus, WorkspaceTask[]>;
  isLoading: boolean;
  updatingTaskId: string | null;
  editingTaskId: string | null;
  deletingTaskId: string | null;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onOpenTaskDetails: (taskId: string) => void;
  onRequestEditTask: (task: WorkspaceTask) => void;
  /** When omitted, delete control is hidden (member assignee view). */
  onRequestDeleteTask?: (task: WorkspaceTask) => void;
};

function findTaskById(
  tasksByStatus: Record<TaskStatus, WorkspaceTask[]>,
  taskId: string,
): WorkspaceTask | undefined {
  for (const column of BOARD_COLUMNS) {
    const found = tasksByStatus[column.status].find((task) => task.id === taskId);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

type TaskCardProps = {
  task: WorkspaceTask;
  isBoardLocked: boolean;
  isDragging: boolean;
  editingTaskId: string | null;
  deletingTaskId: string | null;
  updatingTaskId: string | null;
  onDraggingTaskChange: (taskId: string | null) => void;
  onOpenTaskDetails: (taskId: string) => void;
  onRequestEditTask: (task: WorkspaceTask) => void;
  onRequestDeleteTask?: (task: WorkspaceTask) => void;
};

function TaskCard({
  task,
  isBoardLocked,
  isDragging,
  editingTaskId,
  deletingTaskId,
  updatingTaskId,
  onDraggingTaskChange,
  onOpenTaskDetails,
  onRequestEditTask,
  onRequestDeleteTask,
}: TaskCardProps) {
  const handleOpen = useCallback((): void => {
    onOpenTaskDetails(task.id);
  }, [onOpenTaskDetails, task.id]);

  const isCardBusy =
    updatingTaskId === task.id ||
    editingTaskId === task.id ||
    deletingTaskId === task.id;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpen();
    }
  };

  const isDoneLocked = task.status === 'DONE';
  const draggable = !isBoardLocked && !isCardBusy && !isDoneLocked;

  const handleShellClick = (event: MouseEvent<HTMLDivElement>): void => {
    if ((event.target as HTMLElement).closest('[data-task-action]')) {
      return;
    }
    handleOpen();
  };

  return (
    <div
      aria-disabled={isCardBusy || isBoardLocked}
      aria-label={`Open task: ${task.title}`}
      className={cn(
        'border-border/50 bg-background/80 relative rounded-md border px-2 py-1.5 outline-none transition-[opacity,box-shadow,border-color,background-color] select-none',
        'hover:border-border/80 hover:bg-muted/25 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        (isCardBusy || isBoardLocked) && 'opacity-55',
        isDragging && 'task-board-card--dragging transition-none',
      )}
      draggable={draggable}
      onClick={handleShellClick}
      onDragEnd={() => {
        onDraggingTaskChange(null);
      }}
      onDragStart={(event) => {
        if (!draggable) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(TASK_DRAG_MIME, task.id);
        event.dataTransfer.setData('text/plain', task.id);
        onDraggingTaskChange(task.id);
      }}
      onKeyDown={handleKeyDown}
      tabIndex={isCardBusy || isBoardLocked ? -1 : 0}
    >
      <div className="flex items-start gap-1.5">
        <p className="text-foreground min-w-0 flex-1 text-xs font-medium leading-snug">
          {task.title}
        </p>
        {!isDoneLocked || isCardBusy ? (
          <div className="flex shrink-0 items-center gap-0">
            {!isDoneLocked ? (
              <>
                <Button
                  aria-label="Edit task"
                  className="size-6"
                  data-task-action
                  disabled={isCardBusy || isBoardLocked}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRequestEditTask(task);
                  }}
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <Pencil className="text-muted-foreground size-3" aria-hidden />
                </Button>
                {onRequestDeleteTask !== undefined ? (
                  <Button
                    aria-label="Delete task"
                    className="size-6 text-destructive hover:text-destructive"
                    data-task-action
                    disabled={isCardBusy || isBoardLocked}
                    onClick={(event) => {
                      event.stopPropagation();
                      onRequestDeleteTask(task);
                    }}
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="size-3" aria-hidden />
                  </Button>
                ) : null}
              </>
            ) : null}
            {isCardBusy ? (
              <Loader2
                className="text-muted-foreground size-3.5 shrink-0 animate-spin"
                aria-hidden
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TaskBoardColumns({
  tasksByStatus,
  isLoading,
  updatingTaskId,
  editingTaskId,
  deletingTaskId,
  onMoveTask,
  onOpenTaskDetails,
  onRequestEditTask,
  onRequestDeleteTask,
}: TaskBoardColumnsProps) {
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const isBoardLocked = updatingTaskId !== null;

  useEffect(() => {
    const clearDragChrome = (): void => {
      setDragOverColumn(null);
      setDraggingTaskId(null);
    };
    document.addEventListener('dragend', clearDragChrome);
    return () => document.removeEventListener('dragend', clearDragChrome);
  }, []);

  const handleColumnDragOver = (
    event: DragEvent<HTMLDivElement>,
    columnStatus: TaskStatus,
  ): void => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnStatus);
  };

  const handleColumnDrop = (
    event: DragEvent<HTMLDivElement>,
    columnStatus: TaskStatus,
  ): void => {
    event.preventDefault();
    setDragOverColumn(null);
    setDraggingTaskId(null);

    if (isBoardLocked) {
      return;
    }

    const taskId =
      event.dataTransfer.getData(TASK_DRAG_MIME) ||
      event.dataTransfer.getData('text/plain').trim();

    if (taskId.length === 0) {
      return;
    }

    const task = findTaskById(tasksByStatus, taskId);
    if (task === undefined || task.status === columnStatus) {
      return;
    }
    if (task.status === 'DONE') {
      return;
    }

    onMoveTask(taskId, columnStatus);
  };

  return (
    <div className="max-sm:-mx-3 sm:mx-0">
      <section
        aria-busy={isLoading || undefined}
        className={cn(
          'gap-3',
          'max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:overflow-y-visible max-sm:pb-2 max-sm:scroll-pl-3 max-sm:scroll-pr-3 max-sm:pl-0.5 max-sm:pr-1',
          'sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 sm:pl-0 sm:pr-0 xl:grid-cols-4',
        )}
      >
      {BOARD_COLUMNS.map((column) => {
        const items = tasksByStatus[column.status];
        const isDropTarget = dragOverColumn === column.status;

        return (
          <article
            className="min-w-0 max-sm:w-[min(88vw,19.5rem)] max-sm:max-w-[min(88vw,19.5rem)] max-sm:shrink-0 max-sm:snap-center sm:w-auto"
            key={column.status}
          >
            <Card
              className={cn(
                'h-full border-t-2 shadow-none',
                COLUMN_TOP_ACCENT[column.status],
              )}
            >
              <CardHeader className="gap-2 sm:items-center">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <CardTitle className="flex items-center gap-1.5">
                    <ColumnStatusIcon status={column.status} />
                    <span className="truncate">{column.title}</span>
                  </CardTitle>
                  <CardDescription className="line-clamp-2 sm:line-clamp-1">
                    {column.subtitle}
                  </CardDescription>
                </div>
                <Badge
                  className="tabular-nums"
                  size="default"
                  title="Tasks in this column"
                  variant="outline"
                >
                  {isLoading ? (
                    <Skeleton className="mx-auto h-3 w-4 rounded-sm" aria-hidden />
                  ) : (
                    items.length
                  )}
                </Badge>
              </CardHeader>
              <Separator className="bg-border/50" />
              <CardContent
                className={cn(
                  'max-h-[min(52vh,24rem)] space-y-1.5 overflow-y-auto overflow-x-hidden p-2 sm:max-h-[min(48vh,26rem)]',
                  'min-h-32 sm:min-h-36',
                  isDropTarget &&
                    'bg-primary/[0.06] ring-primary/30 ring-1 ring-inset dark:bg-primary/[0.09]',
                )}
                onDragOver={(event) => {
                  handleColumnDragOver(event, column.status);
                }}
                onDrop={(event) => {
                  handleColumnDrop(event, column.status);
                }}
              >
                {isLoading
                  ? Array.from({ length: COLUMN_SKELETON_CARD_COUNT }, (_, skeletonIndex) => (
                      <TaskCardSkeleton key={skeletonIndex} />
                    ))
                  : null}

                {!isLoading && items.length === 0 ? (
                  <div className="text-muted-foreground flex min-h-24 items-center justify-center rounded-md border border-dashed border-border/50 bg-muted/5 px-3 py-5 text-center text-xs leading-relaxed">
                    Drop tasks here
                  </div>
                ) : null}

                {!isLoading
                  ? items.map((task) => (
                      <TaskCard
                        deletingTaskId={deletingTaskId}
                        editingTaskId={editingTaskId}
                        isBoardLocked={isBoardLocked}
                        isDragging={draggingTaskId === task.id}
                        key={task.id}
                        onDraggingTaskChange={setDraggingTaskId}
                        onOpenTaskDetails={onOpenTaskDetails}
                        onRequestDeleteTask={onRequestDeleteTask}
                        onRequestEditTask={onRequestEditTask}
                        task={task}
                        updatingTaskId={updatingTaskId}
                      />
                    ))
                  : null}
              </CardContent>
            </Card>
          </article>
        );
      })}
      </section>
    </div>
  );
}
