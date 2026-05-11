import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import type { TaskStatus, WorkspaceTask } from '@/lib/api/Api';
import {
  type TaskEditFormValues,
  type TaskFilterFormValues,
  taskFilterSchema,
} from '@/lib/validation/workspaceTaskSchemas';
import { TaskBoardColumns } from './components/task-board/TaskBoardColumns';
import { TaskBoardHeader } from './components/task-board/TaskBoardHeader';
import { TaskDetailsDialog } from './components/task-board/TaskDetailsDialog';
import { TaskEditDialog } from './components/task-board/TaskEditDialog';
import { TaskFiltersSection } from './components/task-board/TaskFiltersSection';
import type { TaskFilter } from './components/task-board/taskBoard.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { taskDetailsClosed } from '@/features/workspace/slice/workspaceTaskBoardSlice';
import {
  userTaskAdvanceFlowRequested,
  userTaskBoardSyncFlowRequested,
  userTaskDetailsOpenFlowRequested,
  userTaskDetailsRefreshFlowRequested,
  userTaskUpdateFlowRequested,
} from '@/features/workspace/saga/userTaskBoardSaga';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMemberMyTasksRealtime } from '@/lib/realtime/useMemberMyTasksRealtime';

const TASK_FILTER_SEARCH_DEBOUNCE_MS = 400;

export function TenantUserDashboardPage() {
  const dispatch = useAppDispatch();
  const tenantRole = useAppSelector((s) => s.tenantAuth.tenantRole);
  const isMemberRole = tenantRole === 'member';

  useMemberMyTasksRealtime({ enabled: isMemberRole });
  const {
    tasks,
    statusCounts,
    isLoading,
    updatingTaskId,
    editingTaskId,
    error,
    lastEditSucceededAt,
    details,
  } = useAppSelector((state) => state.workspaceTaskBoard);
  const [filterStatus, setFilterStatus] = useState<TaskFilter>('ALL');
  const [editTask, setEditTask] = useState<WorkspaceTask | null>(null);

  const {
    register: registerTaskFilter,
    reset: resetTaskFilterForm,
    setValue: setTaskFilterValue,
    watch: watchTaskFilter,
    formState: { errors: taskFilterErrors },
  } = useForm<TaskFilterFormValues>({
    resolver: zodResolver(taskFilterSchema),
    defaultValues: {
      search: '',
      status: filterStatus,
    },
  });

  const watchedSearchInput = watchTaskFilter('search');
  const debouncedSearchQuery = useDebouncedValue(watchedSearchInput ?? '', TASK_FILTER_SEARCH_DEBOUNCE_MS);
  const skipDebouncedSearchSyncRef = useRef(true);

  useEffect(() => {
    dispatch(userTaskBoardSyncFlowRequested({}));
  }, [dispatch]);

  useEffect(() => {
    if (skipDebouncedSearchSyncRef.current) {
      skipDebouncedSearchSyncRef.current = false;
      return;
    }
    dispatch(
      userTaskBoardSyncFlowRequested({
        searchQuery: debouncedSearchQuery.trim(),
        statusFilter: filterStatus,
      }),
    );
  }, [debouncedSearchQuery, filterStatus, dispatch]);

  useEffect(() => {
    if (lastEditSucceededAt === null) {
      return;
    }
    setEditTask(null);
  }, [lastEditSucceededAt]);

  const tasksByStatus = useMemo<Record<TaskStatus, WorkspaceTask[]>>(() => {
    const grouped: Record<TaskStatus, WorkspaceTask[]> = {
      TODO: [],
      IN_PROGRESS: [],
      BLOCKED: [],
      DONE: [],
    };
    for (const task of tasks) {
      grouped[task.status].push(task);
    }
    return grouped;
  }, [tasks]);

  const handleMoveTask = (taskId: string, status: TaskStatus): void => {
    if (updatingTaskId !== null) return;
    const subject = tasks.find((item) => item.id === taskId);
    if (subject === undefined || subject.status === 'DONE') return;
    dispatch(userTaskAdvanceFlowRequested({ taskId, status }));
  };

  const handleOpenTaskDetails = (taskId: string): void => {
    dispatch(userTaskDetailsOpenFlowRequested({ taskId }));
  };

  const handleSaveEditedTask = (values: TaskEditFormValues): void => {
    if (editTask === null) return;
    const descriptionTrimmed = values.description?.trim();
    dispatch(
      userTaskUpdateFlowRequested({
        taskId: editTask.id,
        title: values.title.trim(),
        description:
          descriptionTrimmed !== undefined && descriptionTrimmed.length > 0
            ? descriptionTrimmed
            : undefined,
        status: values.status,
      }),
    );
  };

  const handleRetryTaskDetails = (): void => {
    if (details.taskId === null) return;
    dispatch(userTaskDetailsRefreshFlowRequested());
  };

  if (!isMemberRole) {
    return <Navigate replace to="/tenant/workspaces" />;
  }

  const totalTaskCount =
    statusCounts.TODO +
    statusCounts.IN_PROGRESS +
    statusCounts.BLOCKED +
    statusCounts.DONE;

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5">
      <TaskBoardHeader
        badgeLabel="Your assignments"
        blockedCount={statusCounts.BLOCKED}
        description="Tasks assigned to you by your organization. Update status and notes; creation and deletion are limited to workspace admins."
        doneCount={statusCounts.DONE}
        inProgressCount={statusCounts.IN_PROGRESS}
        isLoading={isLoading}
        title="My tasks"
        todoCount={statusCounts.TODO}
        totalTaskCount={totalTaskCount}
      />

      <section className="border-border/70 rounded-2xl border bg-card/95 p-4 shadow-sm sm:p-5">
        <div className="mb-3">
          <h2 className="text-foreground text-sm font-semibold">Filters</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Search and filter your assigned work.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 flex-wrap items-start gap-2">
            <TaskFiltersSection
              filterStatus={filterStatus}
              onClearFilters={() => {
                resetTaskFilterForm({
                  search: '',
                  status: 'ALL',
                });
                setFilterStatus('ALL');
                dispatch(
                  userTaskBoardSyncFlowRequested({
                    searchQuery: '',
                    statusFilter: 'ALL',
                  }),
                );
              }}
              onFilterStatusChange={(status) => {
                setFilterStatus(status);
                setTaskFilterValue('status', status, { shouldValidate: true });
              }}
              registerTaskFilter={registerTaskFilter}
              taskFilterErrors={taskFilterErrors}
            />
          </div>
        </div>
      </section>

      {error !== null ? (
        <section className="border-destructive/40 bg-destructive/10 rounded-xl border px-4 py-3 text-sm shadow-sm">
          <p className="text-destructive font-medium">{error}</p>
          <Button
            className="mt-3"
            onClick={() => {
              dispatch(userTaskBoardSyncFlowRequested({}));
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        </section>
      ) : null}

      <TaskBoardColumns
        deletingTaskId={null}
        editingTaskId={editingTaskId}
        isLoading={isLoading}
        onMoveTask={handleMoveTask}
        onOpenTaskDetails={handleOpenTaskDetails}
        onRequestEditTask={(task) => {
          setEditTask(task);
        }}
        tasksByStatus={tasksByStatus}
        updatingTaskId={updatingTaskId}
      />

      <TaskEditDialog
        assignableTenantUsers={[]}
        assignableTenantUsersError={null}
        assignableTenantUsersLoading={false}
        assigneeEditable={false}
        attachmentsEditable={false}
        isSaving={editTask !== null && editingTaskId === editTask.id}
        onOpenChange={(open) => {
          if (!open) {
            setEditTask(null);
          }
        }}
        onSave={handleSaveEditedTask}
        open={editTask !== null}
        task={editTask}
      />

      <TaskDetailsDialog
        error={details.error}
        isLoading={details.isLoading}
        onOpenChange={(open) => {
          if (!open) {
            dispatch(taskDetailsClosed());
          }
        }}
        onRetry={handleRetryTaskDetails}
        open={details.open}
        task={details.task}
      />
    </div>
  );
}
