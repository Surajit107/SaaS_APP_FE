import { ListFilter, RotateCcw, Search } from 'lucide-react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { TaskFilterFormValues } from '@/lib/validation/workspaceTaskSchemas';
import type { TaskFilter } from './taskBoard.types';

type TaskFiltersSectionProps = {
  registerTaskFilter: UseFormRegister<TaskFilterFormValues>;
  taskFilterErrors: FieldErrors<TaskFilterFormValues>;
  filterStatus: TaskFilter;
  onFilterStatusChange: (status: TaskFilter) => void;
  onClearFilters: () => void;
};

export function TaskFiltersSection({
  registerTaskFilter,
  taskFilterErrors,
  filterStatus,
  onFilterStatusChange,
  onClearFilters,
}: TaskFiltersSectionProps) {
  return (
    <div
      className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2"
      role="search"
    >
      <div className="relative min-w-0 flex-1">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2"
          aria-hidden
        />
        <Input
          aria-invalid={taskFilterErrors.search !== undefined}
          className="h-7 border-border/40 bg-background/60 pr-2 pl-7 text-xs shadow-none md:text-xs"
          maxLength={120}
          placeholder="Search tasks…"
          {...registerTaskFilter('search')}
        />
        {taskFilterErrors.search ? (
          <p className="text-destructive mt-1 text-xs" role="alert">
            {taskFilterErrors.search.message}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:ml-auto">
        <Select
          value={filterStatus}
          onValueChange={(value) => {
            onFilterStatusChange(value as TaskFilter);
          }}
        >
          <SelectTrigger
            aria-label="Filter by status"
            className="border-border/50 bg-background/80 text-foreground h-7 w-full min-w-0 gap-1.5 py-0 pr-1.5 pl-2 text-xs leading-none shadow-none focus-visible:ring-1 focus-visible:ring-ring/40 sm:w-[10.75rem] [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:opacity-80"
          >
            <span className="flex min-h-0 min-w-0 flex-1 items-center gap-1.5 self-center">
              <ListFilter className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
              <SelectValue className="leading-none" placeholder="Status" />
            </span>
          </SelectTrigger>
          <SelectContent align="end" className="min-w-[var(--radix-select-trigger-width)]">
            <SelectItem className="text-xs" value="ALL">
              All statuses
            </SelectItem>
            <SelectItem className="text-xs" value="TODO">
              To do
            </SelectItem>
            <SelectItem className="text-xs" value="IN_PROGRESS">
              In progress
            </SelectItem>
            <SelectItem className="text-xs" value="BLOCKED">
              Blocked
            </SelectItem>
            <SelectItem className="text-xs" value="DONE">
              Done
            </SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" {...registerTaskFilter('status')} />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Clear search and status filters"
              className="text-muted-foreground hover:text-foreground size-7 shrink-0"
              onClick={onClearFilters}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <RotateCcw className="size-3.5" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Clear filters</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
