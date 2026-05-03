import { Rows3 } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type TaskBoardHeaderProps = {
  totalTaskCount: number;
  todoCount: number;
  blockedCount: number;
  inProgressCount: number;
  doneCount: number;
  /** When true, stat values render as skeletons (initial board fetch). */
  isLoading?: boolean;
  badgeLabel?: string;
  title?: string;
  description?: string;
};

function BoardStatFigure({
  isLoading,
  value,
  valueClassName,
}: {
  isLoading: boolean;
  value: number;
  valueClassName?: string;
}) {
  if (isLoading) {
    return (
      <Skeleton
        aria-hidden
        className="mx-auto mt-1.5 h-[1.65rem] w-10 rounded-md sm:h-[1.65rem] sm:w-11"
      />
    );
  }
  return (
    <p
      className={cn(
        'mt-1.5 text-2xl font-semibold tabular-nums sm:text-[1.65rem]',
        valueClassName ?? 'text-foreground',
      )}
    >
      {value}
    </p>
  );
}

export function TaskBoardHeader({
  totalTaskCount,
  todoCount,
  blockedCount,
  inProgressCount,
  doneCount,
  isLoading = false,
  badgeLabel = 'Workspace execution board',
  title = 'Tenant Panel Task Board',
  description = 'Professional Jira-lite workflow powered by workspace APIs. Capture work, track active execution, and close tasks with clear status progression.',
}: TaskBoardHeaderProps) {
  return (
    <header
      aria-busy={isLoading || undefined}
      className="border-border/70 from-card via-card to-muted/25 rounded-2xl border bg-gradient-to-r p-4 shadow-sm sm:p-5 md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl flex-1">
          <span className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border border-primary/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
            <Rows3 className="size-3.5" aria-hidden />
            {badgeLabel}
          </span>
          <h1 className="text-foreground mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-[0.92rem]">
            {description}
          </p>
        </div>
        <div className="grid w-full min-w-0 max-w-xl grid-cols-2 gap-2.5 sm:max-w-none sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
          <div className="border-border/70 bg-background/80 rounded-xl border px-3.5 py-3 text-center sm:min-w-[6.5rem]">
            <p className="text-muted-foreground text-[0.72rem] font-medium uppercase tracking-wide sm:text-xs">
              Total
            </p>
            <BoardStatFigure isLoading={isLoading} value={totalTaskCount} />
          </div>
          <div className="border-border/70 bg-background/80 rounded-xl border px-3.5 py-3 text-center sm:min-w-[6.5rem]">
            <p className="text-muted-foreground text-[0.72rem] font-medium uppercase tracking-wide sm:text-xs">
              To do
            </p>
            <BoardStatFigure
              isLoading={isLoading}
              value={todoCount}
              valueClassName="text-slate-600 dark:text-slate-300"
            />
          </div>
          <div className="border-border/70 bg-background/80 rounded-xl border px-3.5 py-3 text-center sm:min-w-[6.5rem]">
            <p className="text-muted-foreground text-[0.72rem] font-medium uppercase tracking-wide sm:text-xs">
              Blocked
            </p>
            <BoardStatFigure
              isLoading={isLoading}
              value={blockedCount}
              valueClassName="text-rose-600 dark:text-rose-400"
            />
          </div>
          <div className="border-border/70 bg-background/80 rounded-xl border px-3.5 py-3 text-center sm:min-w-[6.5rem]">
            <p className="text-muted-foreground text-[0.72rem] font-medium uppercase tracking-wide sm:text-xs">
              Active
            </p>
            <BoardStatFigure
              isLoading={isLoading}
              value={inProgressCount}
              valueClassName="text-amber-500"
            />
          </div>
          <div className="border-border/70 bg-background/80 col-span-2 rounded-xl border px-3.5 py-3 text-center sm:col-span-1 sm:min-w-[6.5rem]">
            <p className="text-muted-foreground text-[0.72rem] font-medium uppercase tracking-wide sm:text-xs">
              Done
            </p>
            <BoardStatFigure
              isLoading={isLoading}
              value={doneCount}
              valueClassName="text-emerald-500"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
