import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CirclePlus, Kanban, Layers } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CREATE_UPLOAD_SIGNATURE,
  DELETE_FILE_ASSET,
  GET_WORKSPACE_TASK_DETAILS,
  REGISTER_FILE_ASSET,
  type TaskStatus,
  type WorkspaceTask,
} from '@/lib/api/Api';
import { getApiErrorMessage } from '@/lib/api/errorMessage';
import { useWorkspaceBoardRealtime } from '@/lib/realtime/useWorkspaceBoardRealtime';
import { tenantUserPrimaryLabel } from '@/lib/tenant/tenantIdentityDisplay';
import { uploadToCloudinaryWithPresignedData } from '@/lib/upload/presignedCloudinaryUpload';
import {
  type TaskCreateFormValues,
  type TaskEditFormValues,
  type TaskFilterFormValues,
  taskCreateSchema,
  taskFilterSchema,
} from '@/lib/validation/workspaceTaskSchemas';
import { TaskBoardColumns } from './components/task-board/TaskBoardColumns';
import { TaskBoardHeader } from './components/task-board/TaskBoardHeader';
import { TaskCreateSection } from './components/task-board/TaskCreateSection';
import { TaskDeleteConfirmDialog } from './components/task-board/TaskDeleteConfirmDialog';
import { TaskDetailsDialog } from './components/task-board/TaskDetailsDialog';
import { TaskEditDialog } from './components/task-board/TaskEditDialog';
import { TaskFiltersSection } from './components/task-board/TaskFiltersSection';
import type { DraftAttachment, TaskFilter } from './components/task-board/taskBoard.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { taskDetailsClosed } from '@/features/workspace/slice/workspaceTaskBoardSlice';
import { tenantUserListSyncFlowRequested } from '@/features/tenant/saga/tenantUserListSaga';
import {
  workspaceTaskAdvanceFlowRequested,
  workspaceTaskBoardSyncFlowRequested,
  workspaceTaskCreateFlowRequested,
  workspaceTaskDeleteFlowRequested,
  workspaceTaskDetailsOpenFlowRequested,
  workspaceTaskDetailsRefreshFlowRequested,
  workspaceTaskUpdateFlowRequested,
} from '@/features/workspace/saga/workspaceTaskBoardSaga';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const TASK_FILTER_SEARCH_DEBOUNCE_MS = 400;

export function WorkspaceBoardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const tenantRole = useAppSelector((s) => s.tenantAuth.tenantRole);
  const workspaces = useAppSelector((s) => s.workspace.workspaces);

  const {
    tasks,
    statusCounts,
    isLoading,
    isCreating,
    updatingTaskId,
    editingTaskId,
    deletingTaskId,
    error,
    lastCreateSucceededAt,
    lastEditSucceededAt,
    lastDeleteSucceededAt,
    details,
  } = useAppSelector((state) => state.workspaceTaskBoard);
  const {
    users: tenantUsersForAssign,
    isLoading: tenantUsersAssignListLoading,
    error: tenantUsersAssignListError,
  } = useAppSelector((state) => state.tenantUserList);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [draftAttachments, setDraftAttachments] = useState<DraftAttachment[]>([]);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('TODO');
  const [filterStatus, setFilterStatus] = useState<TaskFilter>('ALL');
  const [editTask, setEditTask] = useState<WorkspaceTask | null>(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState<WorkspaceTask | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === workspaceId) ?? null,
    [workspaces, workspaceId],
  );

  const {
    register: registerCreateTask,
    handleSubmit: handleCreateTaskSubmit,
    reset: resetCreateTaskForm,
    setValue: setCreateTaskValue,
    control: controlCreateTask,
    formState: { errors: createTaskErrors },
  } = useForm<TaskCreateFormValues>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: { title: '', description: '', status: 'TODO', assignedTo: '' },
  });

  const {
    register: registerTaskFilter,
    reset: resetTaskFilterForm,
    setValue: setTaskFilterValue,
    watch: watchTaskFilter,
    formState: { errors: taskFilterErrors },
  } = useForm<TaskFilterFormValues>({
    resolver: zodResolver(taskFilterSchema),
    defaultValues: { search: '', status: filterStatus },
  });

  const sortedAssignableTenantUsers = useMemo(
    () =>
      [...tenantUsersForAssign].sort((a, b) =>
        tenantUserPrimaryLabel(a.displayName, a.email, a.id).localeCompare(
          tenantUserPrimaryLabel(b.displayName, b.email, b.id),
          undefined,
          { sensitivity: 'base' },
        ),
      ),
    [tenantUsersForAssign],
  );

  const watchedSearchInput = watchTaskFilter('search');
  const debouncedSearchQuery = useDebouncedValue(watchedSearchInput ?? '', TASK_FILTER_SEARCH_DEBOUNCE_MS);
  const skipDebouncedSearchSyncRef = useRef(true);

  useEffect(() => {
    if (!workspaceId) return;
    dispatch(workspaceTaskBoardSyncFlowRequested({ workspaceId }));
  }, [dispatch, workspaceId]);

  useWorkspaceBoardRealtime({ workspaceId });

  useEffect(() => {
    if (!workspaceId) return;
    const taskId = searchParams.get('taskId');
    if (!taskId || taskId.trim().length === 0) return;
    dispatch(workspaceTaskDetailsOpenFlowRequested({ workspaceId, taskId }));
    // Clean up the URL so refresh doesn't keep re-opening forever.
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('taskId');
      return next;
    }, { replace: true });
  }, [dispatch, searchParams, setSearchParams, workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    const editTaskId = searchParams.get('editTaskId');
    if (!editTaskId || editTaskId.trim().length === 0) return;

    let cancelled = false;
    const run = async () => {
      try {
        const res = await GET_WORKSPACE_TASK_DETAILS(workspaceId, editTaskId);
        if (cancelled) return;
        setEditTask(res.data.data);
      } catch (e: unknown) {
        toast.error(getApiErrorMessage(e, 'Unable to load task for editing'));
      } finally {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('editTaskId');
          return next;
        }, { replace: true });
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, workspaceId]);

  useEffect(() => {
    if (tenantRole !== 'admin') return;
    dispatch(tenantUserListSyncFlowRequested({ page: 1, searchQuery: '', limit: 100 }));
  }, [dispatch, tenantRole]);

  useEffect(() => {
    if (skipDebouncedSearchSyncRef.current) {
      skipDebouncedSearchSyncRef.current = false;
      return;
    }
    if (!workspaceId) return;
    dispatch(
      workspaceTaskBoardSyncFlowRequested({
        workspaceId,
        searchQuery: debouncedSearchQuery.trim(),
        statusFilter: filterStatus,
      }),
    );
  }, [debouncedSearchQuery, filterStatus, dispatch, workspaceId]);

  useEffect(() => {
    if (lastCreateSucceededAt === null) return;
    resetCreateTaskForm();
    setDraftAttachments([]);
    setCreateStatus('TODO');
    setCreateTaskValue('status', 'TODO', { shouldValidate: true });
  }, [lastCreateSucceededAt, resetCreateTaskForm, setCreateTaskValue]);

  useEffect(() => {
    if (lastEditSucceededAt === null) return;
    setEditTask(null);
  }, [lastEditSucceededAt]);

  useEffect(() => {
    if (lastDeleteSucceededAt === null) return;
    setTaskPendingDelete(null);
  }, [lastDeleteSucceededAt]);

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

  const handleCreateTask = async (values: TaskCreateFormValues): Promise<void> => {
    if (!workspaceId || isCreating) return;
    const title = values.title.trim();
    const description = values.description?.trim();
    dispatch(
      workspaceTaskCreateFlowRequested({
        workspaceId,
        title,
        description: description !== undefined && description.length > 0 ? description : undefined,
        status: values.status,
        tempAttachmentPublicIds: draftAttachments.map((a) => a.publicId),
        assignedTo: values.assignedTo.length > 0 ? values.assignedTo : undefined,
      }),
    );
  };

  const handleUploadFiles = async (files: FileList | null): Promise<void> => {
    if (files === null || files.length === 0 || isUploading) return;
    const selectedFiles = Array.from(files).slice(0, 10);
    const totalFiles = selectedFiles.length;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const uploadedDrafts: DraftAttachment[] = [];
      for (let index = 0; index < selectedFiles.length; index += 1) {
        const selectedFile = selectedFiles[index];
        const segment = 100 / totalFiles;
        const base = index * segment;
        setUploadProgress(Math.round(base));

        const signatureResponse = await CREATE_UPLOAD_SIGNATURE({
          fileName: selectedFile.name,
          mimeType: selectedFile.type || 'application/octet-stream',
          resourceType: 'auto',
          intent: 'WORKSPACE_TASK',
        });
        setUploadProgress(Math.round(base + segment * 0.08));

        const cloudinaryUploaded = await uploadToCloudinaryWithPresignedData(
          selectedFile,
          signatureResponse.data.data,
          {
            onUploadProgress: (pct) => {
              const mapped = base + segment * (0.08 + 0.8 * Math.min(100, Math.max(0, pct)) / 100);
              setUploadProgress(Math.min(100, Math.round(mapped)));
            },
          },
        );
        setUploadProgress(Math.round(base + segment * 0.88));

        const registeredResponse = await REGISTER_FILE_ASSET({
          publicId: cloudinaryUploaded.publicId,
          secureUrl: cloudinaryUploaded.secureUrl,
          resourceType: cloudinaryUploaded.resourceType,
          format: cloudinaryUploaded.format,
          bytes: cloudinaryUploaded.bytes,
          mimeType: selectedFile.type || 'application/octet-stream',
        });
        const uploaded = registeredResponse.data.data;
        uploadedDrafts.push({
          publicId: uploaded.publicId,
          secureUrl: uploaded.secureUrl,
          mimeType: uploaded.mimeType,
          originalName: selectedFile.name,
          bytes: selectedFile.size,
        });
        setUploadProgress(Math.round(base + segment));
      }
      setDraftAttachments((prev) => [...prev, ...uploadedDrafts].slice(0, 20));
      toast.success(
        uploadedDrafts.length === 1
          ? 'Attachment uploaded'
          : `${uploadedDrafts.length} attachments uploaded`,
      );
    } catch (uploadError: unknown) {
      toast.error(getApiErrorMessage(uploadError, 'Unable to upload attachment'));
    } finally {
      if (fileInputRef.current !== null) fileInputRef.current.value = '';
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const handleRemoveDraftAttachment = async (attachment: DraftAttachment): Promise<void> => {
    if (removingAttachmentId !== null) return;
    try {
      setRemovingAttachmentId(attachment.publicId);
      await DELETE_FILE_ASSET({ publicId: attachment.publicId });
      setDraftAttachments((prev) => prev.filter((item) => item.publicId !== attachment.publicId));
      toast.success('Attachment removed');
    } catch (removeError: unknown) {
      toast.error(getApiErrorMessage(removeError, 'Unable to remove attachment'));
    } finally {
      setRemovingAttachmentId(null);
    }
  };

  const handleMoveTask = (taskId: string, status: TaskStatus): void => {
    if (!workspaceId || updatingTaskId !== null) return;
    const subject = tasks.find((item) => item.id === taskId);
    if (subject !== undefined && subject.status === 'DONE') return;
    dispatch(workspaceTaskAdvanceFlowRequested({ workspaceId, taskId, status }));
  };

  const handleOpenTaskDetails = (taskId: string): void => {
    if (!workspaceId) return;
    dispatch(workspaceTaskDetailsOpenFlowRequested({ workspaceId, taskId }));
  };

  const handleSaveEditedTask = (values: TaskEditFormValues): void => {
    if (!workspaceId || editTask === null) return;
    const descriptionTrimmed = values.description?.trim();
    const normalizedUrls = (values.attachmentUrls ?? [])
      .map((entry) => entry.url.trim())
      .filter((url) => url.length > 0);
    const isWorkspaceAdmin = tenantRole === 'admin';
    dispatch(
      workspaceTaskUpdateFlowRequested({
        workspaceId,
        taskId: editTask.id,
        title: values.title.trim(),
        description:
          descriptionTrimmed !== undefined && descriptionTrimmed.length > 0
            ? descriptionTrimmed
            : undefined,
        status: values.status,
        attachmentUrls: normalizedUrls,
        ...(isWorkspaceAdmin
          ? { assignedTo: values.assignedTo.length > 0 ? values.assignedTo : null }
          : { omitAttachments: true }),
      }),
    );
  };

  const handleRetryTaskDetails = (): void => {
    if (details.taskId === null) return;
    dispatch(workspaceTaskDetailsRefreshFlowRequested());
  };

  const totalTaskCount =
    statusCounts.TODO + statusCounts.IN_PROGRESS + statusCounts.BLOCKED + statusCounts.DONE;

  // Guard: workspaceId param must exist
  if (!workspaceId) {
    return <Navigate replace to="/tenant/workspaces" />;
  }

  const workspaceNameNode = activeWorkspace ? (
    <span className="font-semibold">{activeWorkspace.name}</span>
  ) : (
    <Skeleton className="inline-block h-4 w-32 align-middle" />
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => navigate('/tenant/workspaces')}
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">Workspaces</span>
          </Button>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
              <Layers className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="text-foreground text-xl font-bold tracking-tight leading-tight truncate">
                {workspaceNameNode}
              </h1>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Task board for this workspace
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Task counts header ───────────────────────────────────────────────── */}
      <TaskBoardHeader
        blockedCount={statusCounts.BLOCKED}
        doneCount={statusCounts.DONE}
        inProgressCount={statusCounts.IN_PROGRESS}
        isLoading={isLoading}
        todoCount={statusCounts.TODO}
        totalTaskCount={totalTaskCount}
      />

      {/* ── Board & create tabs ──────────────────────────────────────────────── */}
      <Tabs className="gap-0" defaultValue="board">
        <div className="border-border/70 overflow-hidden rounded-2xl border bg-card/95 shadow-sm">
          <div className="bg-muted/25 border-border/60 flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <h2 className="text-foreground text-sm font-semibold tracking-tight">
                Task board
              </h2>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                Switch between the kanban board and creating new work.
              </p>
            </div>
            <TabsList className="bg-muted/60 grid h-auto w-full shrink-0 grid-cols-2 gap-1 rounded-xl p-1 sm:w-auto sm:min-w-[min(100%,16rem)] sm:inline-flex sm:h-10">
              <TabsTrigger className="gap-1.5 px-2 sm:px-3" value="board">
                <Kanban className="size-4 shrink-0" aria-hidden />
                <span className="truncate">Board</span>
              </TabsTrigger>
              {tenantRole === 'admin' && (
                <TabsTrigger className="gap-1.5 px-2 sm:px-3" value="create">
                  <CirclePlus className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">Create</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* ── Board tab ─────────────────────────────────────────────────────── */}
          <TabsContent className="m-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0" value="board">
            <div className="space-y-4 p-4 sm:p-5">
              {error !== null && (
                <section className="border-destructive/40 bg-destructive/10 rounded-xl border px-4 py-3 text-sm shadow-sm">
                  <p className="text-destructive font-medium">{error}</p>
                  <Button
                    className="mt-3"
                    onClick={() =>
                      dispatch(workspaceTaskBoardSyncFlowRequested({ workspaceId }))
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Retry
                  </Button>
                </section>
              )}
              <Separator className="bg-border/70" />
              <TaskFiltersSection
                filterStatus={filterStatus}
                onClearFilters={() => {
                  resetTaskFilterForm({ search: '', status: 'ALL' });
                  setFilterStatus('ALL');
                  dispatch(
                    workspaceTaskBoardSyncFlowRequested({
                      workspaceId,
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
              <Separator className="bg-border/70" />
              <TaskBoardColumns
                deletingTaskId={deletingTaskId}
                editingTaskId={editingTaskId}
                isLoading={isLoading}
                onMoveTask={handleMoveTask}
                onOpenTaskDetails={handleOpenTaskDetails}
                onRequestDeleteTask={(task) => setTaskPendingDelete(task)}
                onRequestEditTask={(task) => setEditTask(task)}
                tasksByStatus={tasksByStatus}
                updatingTaskId={updatingTaskId}
              />
            </div>
          </TabsContent>

          {/* ── Create tab (admin only) ────────────────────────────────────────── */}
          {tenantRole === 'admin' && (
            <TabsContent className="m-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0" value="create">
              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <h3 className="text-foreground text-sm font-semibold">Create task</h3>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Add a task with a clear title and optional context.
                  </p>
                </div>
                <Separator className="bg-border/70" />
                <form
                  className="space-y-3"
                  noValidate
                  onSubmit={handleCreateTaskSubmit((values) => {
                    void handleCreateTask(values);
                  })}
                >
                  <TaskCreateSection
                    assignableTenantUsers={sortedAssignableTenantUsers}
                    assignableTenantUsersError={tenantUsersAssignListError}
                    assignableTenantUsersLoading={tenantUsersAssignListLoading}
                    controlCreateTask={controlCreateTask}
                    createStatus={createStatus}
                    createTaskErrors={createTaskErrors}
                    draftAttachments={draftAttachments}
                    fileInputRef={fileInputRef}
                    isCreating={isCreating}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    onCreateStatusChange={(status) => {
                      setCreateStatus(status);
                      setCreateTaskValue('status', status, { shouldValidate: true });
                    }}
                    onRemoveDraftAttachment={handleRemoveDraftAttachment}
                    onUploadFiles={handleUploadFiles}
                    registerCreateTask={registerCreateTask}
                    removingAttachmentId={removingAttachmentId}
                  />
                </form>
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* ── Dialogs ──────────────────────────────────────────────────────────── */}
      <TaskEditDialog
        assignableTenantUsers={sortedAssignableTenantUsers}
        assignableTenantUsersError={tenantUsersAssignListError}
        assignableTenantUsersLoading={tenantUsersAssignListLoading}
        assigneeEditable={tenantRole === 'admin'}
        attachmentsEditable={tenantRole === 'admin'}
        isSaving={editTask !== null && editingTaskId === editTask.id}
        onOpenChange={(open) => { if (!open) setEditTask(null); }}
        onSave={handleSaveEditedTask}
        open={editTask !== null}
        task={editTask}
      />

      <TaskDeleteConfirmDialog
        isDeleting={taskPendingDelete !== null && deletingTaskId === taskPendingDelete.id}
        onConfirmDelete={() => {
          if (!workspaceId || taskPendingDelete === null) return;
          dispatch(workspaceTaskDeleteFlowRequested({ workspaceId, taskId: taskPendingDelete.id }));
        }}
        onOpenChange={(open) => { if (!open) setTaskPendingDelete(null); }}
        open={taskPendingDelete !== null}
        taskTitle={taskPendingDelete?.title ?? null}
      />

      <TaskDetailsDialog
        error={details.error}
        isLoading={details.isLoading}
        onOpenChange={(open) => { if (!open) dispatch(taskDetailsClosed()); }}
        onRetry={handleRetryTaskDetails}
        open={details.open}
        task={details.task}
      />
    </div>
  );
}
