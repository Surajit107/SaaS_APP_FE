import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FolderOpen, Layers, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  workspaceCreateFlowRequested,
  workspaceDeleteFlowRequested,
  workspaceSyncFlowRequested,
} from '@/features/workspace/saga/workspaceSaga';
import type { Workspace } from '@/lib/api/Api';
import { WorkspaceCreateDialog } from './components/WorkspaceCreateDialog';
import { WorkspaceDeleteDialog } from './components/WorkspaceDeleteDialog';

export function WorkspacesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tenantRole = useAppSelector((s) => s.tenantAuth.tenantRole);
  const { workspaces, isLoading, isCreating, deletingId, error, lastCreateSucceededAt } =
    useAppSelector((s) => s.workspace);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Workspace | null>(null);

  const isAdmin = tenantRole === 'admin';

  useEffect(() => {
    dispatch(workspaceSyncFlowRequested());
  }, [dispatch]);

  const handleCreate = (name: string): void => {
    dispatch(workspaceCreateFlowRequested({ name }));
  };

  const handleConfirmDelete = (): void => {
    if (pendingDelete === null) return;
    dispatch(workspaceDeleteFlowRequested({ workspaceId: pendingDelete.id }));
  };

  useEffect(() => {
    if (deletingId === null && pendingDelete !== null) {
      const stillExists = workspaces.some((w) => w.id === pendingDelete.id);
      if (!stillExists) {
        setPendingDelete(null);
      }
    }
  }, [deletingId, workspaces, pendingDelete]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
              <Layers className="size-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-foreground text-xl font-bold tracking-tight leading-tight">
                Workspaces
              </h1>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Select a workspace to open its task board.
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isLoading && (
            <Badge variant="secondary" className="tabular-nums">
              {workspaces.length}{' '}
              {workspaces.length === 1 ? 'workspace' : 'workspaces'}
            </Badge>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="outline"
                  onClick={() => dispatch(workspaceSyncFlowRequested())}
                  disabled={isLoading}
                  aria-label="Refresh workspaces"
                >
                  <RefreshCw
                    className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`}
                    aria-hidden
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh workspaces</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              disabled={isCreating || isLoading}
            >
              <Plus className="size-3.5" aria-hidden />
              New workspace
            </Button>
          )}
        </div>
      </div>

      <Separator className="bg-border/70" />

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error !== null && (
        <div className="border-destructive/40 bg-destructive/10 rounded-xl border px-4 py-3 text-sm shadow-sm">
          <p className="text-destructive font-medium">{error}</p>
          <Button
            className="mt-3"
            onClick={() => dispatch(workspaceSyncFlowRequested())}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── Loading skeleton ──────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent className="pb-3">
                <Skeleton className="h-3.5 w-1/2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-24 ml-auto" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!isLoading && error === null && workspaces.length === 0 && (
        <div className="border-border/60 bg-card/60 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <span className="bg-muted flex size-12 items-center justify-center rounded-xl">
            <FolderOpen className="text-muted-foreground size-6" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="text-foreground text-sm font-semibold">No workspaces yet</p>
            <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">
              {isAdmin
                ? "Create your first workspace to start organising your team's tasks."
                : 'No workspaces have been created for your organisation yet.'}
            </p>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateOpen(true)}
              disabled={isCreating}
            >
              <Plus className="size-3.5" aria-hidden />
              Create workspace
            </Button>
          )}
        </div>
      )}

      {/* ── Workspace grid ────────────────────────────────────────────────── */}
      {!isLoading && workspaces.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => {
            const isBeingDeleted = deletingId === workspace.id;
            return (
              <Card
                key={workspace.id}
                className={[
                  'group flex flex-col border-border/60 shadow-sm transition-all',
                  isBeingDeleted ? 'opacity-50 pointer-events-none' : 'hover:border-primary/40 hover:shadow-md cursor-pointer',
                ].join(' ')}
                onClick={() => {
                  if (!isBeingDeleted) {
                    navigate(`/tenant/workspaces/${workspace.id}`);
                  }
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <Layers className="size-4" aria-hidden />
                    </span>
                    <CardTitle
                      className="text-foreground text-sm font-semibold leading-snug break-words min-w-0 flex-1"
                      title={workspace.name}
                    >
                      {workspace.name}
                    </CardTitle>
                    <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
                  </div>
                </CardHeader>

                <CardContent className="flex-1 pb-3">
                  <p className="text-muted-foreground text-xs">
                    Created{' '}
                    {new Date(workspace.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </CardContent>

                {isAdmin && (
                  <CardFooter
                    className="border-t border-border/50 pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto gap-1.5"
                      disabled={isBeingDeleted || deletingId !== null}
                      onClick={() => setPendingDelete(workspace)}
                      aria-label={`Delete workspace ${workspace.name}`}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      <WorkspaceCreateDialog
        open={isCreateOpen}
        isCreating={isCreating}
        lastCreateSucceededAt={lastCreateSucceededAt}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreate}
      />

      <WorkspaceDeleteDialog
        open={pendingDelete !== null}
        isDeleting={pendingDelete !== null && deletingId === pendingDelete.id}
        workspaceName={pendingDelete?.name ?? null}
        onOpenChange={(open) => {
          if (!open && deletingId === null) setPendingDelete(null);
        }}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
