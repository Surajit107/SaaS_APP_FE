import { useState, type DragEvent } from 'react';
import { ChevronDown, FileText, Loader2, Paperclip, Plus, Upload, X } from 'lucide-react';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TenantUserProfile } from '@/lib/api/types';
import { tenantUserPrimaryLabel } from '@/lib/tenant/tenantIdentityDisplay';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TaskStatus } from '@/lib/api/Api';
import type { TaskCreateFormValues } from '@/lib/validation/workspaceTaskSchemas';
import { ASSIGNED_TO_NONE_SELECT_VALUE, STATUS_LABELS } from './taskBoard.constants';
import { formatFileSize } from './taskBoard.formatters';
import type { DraftAttachment } from './taskBoard.types';

type TaskCreateSectionProps = {
  controlCreateTask: Control<TaskCreateFormValues>;
  registerCreateTask: UseFormRegister<TaskCreateFormValues>;
  createTaskErrors: FieldErrors<TaskCreateFormValues>;
  assignableTenantUsers: TenantUserProfile[];
  assignableTenantUsersLoading: boolean;
  assignableTenantUsersError: string | null;
  isCreating: boolean;
  createStatus: TaskStatus;
  onCreateStatusChange: (status: TaskStatus) => void;
  isUploading: boolean;
  uploadProgress: number;
  draftAttachments: DraftAttachment[];
  removingAttachmentId: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadFiles: (files: FileList | null) => Promise<void>;
  onRemoveDraftAttachment: (attachment: DraftAttachment) => Promise<void>;
};

export function TaskCreateSection({
  controlCreateTask,
  registerCreateTask,
  createTaskErrors,
  assignableTenantUsers,
  assignableTenantUsersLoading,
  assignableTenantUsersError,
  isCreating,
  createStatus,
  onCreateStatusChange,
  isUploading,
  uploadProgress,
  draftAttachments,
  removingAttachmentId,
  fileInputRef,
  onUploadFiles,
  onRemoveDraftAttachment,
}: TaskCreateSectionProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const isUploadDisabled = isUploading || draftAttachments.length >= 20;

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    if (isUploadDisabled) {
      return;
    }
    void onUploadFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (!isUploadDisabled) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  return (
    <>
      <div className="space-y-1">
        <input
          className="border-border/70 bg-muted/25 text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
          maxLength={200}
          placeholder="Task title (required)"
          {...registerCreateTask('title')}
        />
        {createTaskErrors.title ? (
          <p className="text-destructive text-xs" role="alert">
            {createTaskErrors.title.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <textarea
          className="border-border/70 bg-muted/25 text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 min-h-20 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
          maxLength={5000}
          placeholder="Description (optional)"
          rows={3}
          style={{ resize: 'vertical' }}
          {...registerCreateTask('description')}
        />
        {createTaskErrors.description ? (
          <p className="text-destructive text-xs" role="alert">
            {createTaskErrors.description.message}
          </p>
        ) : null}
      </div>
      <input type="hidden" {...registerCreateTask('status')} />
      <div className="grid grid-cols-12 gap-3 pt-1">
        <div className="col-span-12 space-y-1 sm:col-span-6">
          <label
            className="text-foreground block text-xs font-medium"
            htmlFor="task-create-initial-status"
          >
            Initial status
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="border-border/70 bg-muted/25 text-foreground hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-ring/40 h-10 w-full justify-between rounded-lg border px-3 text-sm font-normal shadow-none outline-none focus-visible:ring-2"
                id="task-create-initial-status"
                type="button"
                variant="outline"
              >
                <span className="truncate">{STATUS_LABELS[createStatus]}</span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-56">
              <DropdownMenuRadioGroup
                onValueChange={(value) => {
                  onCreateStatusChange(value as TaskStatus);
                }}
                value={createStatus}
              >
                <DropdownMenuRadioItem value="TODO">To Do</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="IN_PROGRESS">In Progress</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="BLOCKED">Blocked</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="DONE">Done</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {createTaskErrors.status ? (
            <p className="text-destructive text-xs" role="alert">
              {createTaskErrors.status.message}
            </p>
          ) : null}
        </div>
        <div className="col-span-12 space-y-1 sm:col-span-6">
          <label className="text-foreground block text-xs font-medium" htmlFor="task-create-assigned-to">
            Assign to
          </label>
          <Controller
            control={controlCreateTask}
            name="assignedTo"
            render={({ field }) => {
              const selectValue =
                field.value.length > 0 ? field.value : ASSIGNED_TO_NONE_SELECT_VALUE;
              return (
                <Select
                  disabled={assignableTenantUsersLoading}
                  onValueChange={(next) => {
                    field.onChange(
                      next === ASSIGNED_TO_NONE_SELECT_VALUE ? '' : next,
                    );
                  }}
                  value={selectValue}
                >
                  <SelectTrigger
                    className="border-border/70 bg-muted/25 text-foreground focus-visible:border-ring focus-visible:ring-ring/40 h-10 w-full rounded-lg text-sm outline-none focus-visible:ring-2"
                    id="task-create-assigned-to"
                  >
                    <SelectValue placeholder="Choose a tenant user…" />
                  </SelectTrigger>
                  <SelectContent align="start" className="max-h-60">
                    <SelectItem value={ASSIGNED_TO_NONE_SELECT_VALUE}>Unassigned</SelectItem>
                    {assignableTenantUsers.map((user) => {
                      const primary = tenantUserPrimaryLabel(
                        user.displayName,
                        user.email,
                        'User',
                      );
                      const label = user.isActive ? primary : `${primary} (inactive)`;
                      return (
                        <SelectItem key={user.id} value={user.id}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              );
            }}
          />
          {assignableTenantUsersError !== null ? (
            <p className="text-muted-foreground text-xs" role="status">
              {assignableTenantUsersError} — you can still create an unassigned task.
            </p>
          ) : null}
          {createTaskErrors.assignedTo ? (
            <p className="text-destructive text-xs" role="alert">
              {createTaskErrors.assignedTo.message}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <span className="text-muted-foreground text-xs">
          {draftAttachments.length}/20 attachments staged
        </span>
      </div>
      <input
        ref={fileInputRef}
        accept="image/*,video/*,.pdf"
        className="hidden"
        multiple
        onChange={(event) => {
          void onUploadFiles(event.target.files);
        }}
        type="file"
      />
      <div
        className={cn(
          'rounded-xl border border-dashed p-4 transition-colors',
          isUploadDisabled
            ? 'cursor-not-allowed border-border/50 bg-muted/10 opacity-60'
            : cn(
                'cursor-pointer',
                isDragActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border/70 bg-muted/10 hover:border-primary/50 hover:bg-primary/5',
              ),
        )}
        onClick={() => {
          if (!isUploadDisabled) {
            fileInputRef.current?.click();
          }
        }}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !isUploadDisabled) {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={isUploadDisabled ? -1 : 0}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex shrink-0 items-center gap-3">
            {isUploading ? (
              <Loader2 className="text-muted-foreground size-5 animate-spin" aria-hidden />
            ) : (
              <Upload className="text-primary size-5" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="text-foreground text-sm font-medium">
                Drag & drop files here, or click to upload
              </p>
              <p className="text-muted-foreground text-xs">
                Supports images, video, and PDF. Maximum 20 attachments.
              </p>
            </div>
          </div>
          {isUploading ? (
            <div
              aria-live="polite"
              className="border-border/70 bg-background/40 flex min-h-10 w-full min-w-0 cursor-default flex-col justify-center gap-2 rounded-lg border px-3 py-2.5 sm:max-w-md sm:ml-auto"
              onClick={(event) => {
                event.stopPropagation();
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
              }}
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground font-medium">Uploading…</span>
                <span className="text-muted-foreground tabular-nums">
                  {Math.min(100, Math.max(0, uploadProgress))}%
                </span>
              </div>
              <Progress
                aria-label="Upload progress"
                className="h-1.5"
                value={Math.min(100, Math.max(0, uploadProgress))}
              />
            </div>
          ) : null}
        </div>
      </div>
      {draftAttachments.length > 0 ? (
        <div className="border-border/70 space-y-2 rounded-xl border bg-muted/10 p-3">
          <p className="text-foreground flex items-center gap-1.5 text-xs font-medium">
            <Paperclip className="size-3.5" aria-hidden />
            Staged attachments
          </p>
          <ul className="space-y-2">
            {draftAttachments.map((attachment) => (
              <li
                className="border-border/70 bg-background/70 flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                key={attachment.publicId}
              >
                <div className="min-w-0">
                  <p className="text-foreground flex items-center gap-2 truncate text-xs font-medium">
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate">{attachment.originalName}</span>
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    {formatFileSize(attachment.bytes)} • {attachment.mimeType}
                  </p>
                </div>
                <Button
                  disabled={removingAttachmentId === attachment.publicId}
                  onClick={() => {
                    void onRemoveDraftAttachment(attachment);
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {removingAttachmentId === attachment.publicId ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <X className="size-3.5" aria-hidden />
                  )}
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex justify-end pt-1">
        <Button className="h-10 min-w-32" disabled={isCreating} type="submit">
          {isCreating ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          Add task
        </Button>
      </div>
    </>
  );
}
