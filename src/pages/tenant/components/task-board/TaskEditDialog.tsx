import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ExternalLink, Loader2, Paperclip, Plus, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskStatus, WorkspaceTask } from '@/lib/api/Api';
import type { TenantUserProfile } from '@/lib/api/types';
import { tenantUserPrimaryLabel } from '@/lib/tenant/tenantIdentityDisplay';
import { cn } from '@/lib/utils';
import {
  type TaskEditFormValues,
  taskEditSchema,
} from '@/lib/validation/workspaceTaskSchemas';
import { AttachmentImagePreview, tryParseHttpUrl } from './attachmentUrlPreview';
import {
  ASSIGNED_TO_NONE_SELECT_VALUE,
  STATUS_LABELS,
} from './taskBoard.constants';

type TaskEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: WorkspaceTask | null;
  isSaving: boolean;
  onSave: (values: TaskEditFormValues) => void;
  /** When false, attachment URLs are read-only (tenant members). */
  attachmentsEditable?: boolean;
  /** When false, assignee field is hidden and must not be PATCHed (tenant members). */
  assigneeEditable?: boolean;
  assignableTenantUsers: TenantUserProfile[];
  assignableTenantUsersLoading: boolean;
  assignableTenantUsersError: string | null;
};

export function TaskEditDialog({
  open,
  onOpenChange,
  task,
  isSaving,
  onSave,
  attachmentsEditable = true,
  assigneeEditable = true,
  assignableTenantUsers,
  assignableTenantUsersLoading,
  assignableTenantUsersError,
}: TaskEditDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<TaskEditFormValues>({
    resolver: zodResolver(taskEditSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO',
      assignedTo: '',
      attachmentUrls: [] as { url: string }[],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'attachmentUrls',
  });

  const editStatus = watch('status');

  useEffect(() => {
    if (task === null) {
      return;
    }
    reset({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      assignedTo: task.assignedTo ?? '',
      attachmentUrls:
        task.attachmentUrls.length > 0 ? task.attachmentUrls.map((url) => ({ url })) : [],
    });
  }, [task, reset]);

  const handleDialogOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen && isSaving) {
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog onOpenChange={handleDialogOpenChange} open={open}>
      <DialogContent className="border-border/70 flex max-h-[90vh] w-[calc(100vw-1.25rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-border/70 shrink-0 border-b px-6 py-5 sm:px-8">
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>
            {attachmentsEditable
              ? 'Update fields and attachment links. Saving replaces the attachment URL list on the server.'
              : 'Update title, description, and status. Attachments are view-only.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          noValidate
          onSubmit={handleSubmit((values) => {
            onSave(values);
          })}
        >
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5 sm:px-8">
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-start">
              <div className="min-w-0 space-y-4">
                <div className="space-y-1">
                  <label className="text-foreground text-xs font-medium" htmlFor="edit-task-title">
                    Title
                  </label>
                  <input
                    className="border-border/70 bg-muted/25 text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
                    disabled={isSaving}
                    id="edit-task-title"
                    maxLength={200}
                    {...register('title')}
                  />
                  {errors.title ? (
                    <p className="text-destructive text-xs" role="alert">
                      {errors.title.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label
                    className="text-foreground text-xs font-medium"
                    htmlFor="edit-task-description"
                  >
                    Description
                  </label>
                  <textarea
                    className="border-border/70 bg-muted/25 text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 min-h-[120px] w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
                    disabled={isSaving}
                    id="edit-task-description"
                    maxLength={5000}
                    placeholder="Optional"
                    rows={5}
                    style={{ resize: 'vertical' }}
                    {...register('description')}
                  />
                  {errors.description ? (
                    <p className="text-destructive text-xs" role="alert">
                      {errors.description.message}
                    </p>
                  ) : null}
                </div>

                <input type="hidden" {...register('status')} />
                <div className="grid grid-cols-12 gap-3">
                  <div
                    className={cn(
                      'space-y-1',
                      assigneeEditable ? 'col-span-12 sm:col-span-6' : 'col-span-12',
                    )}
                  >
                    <label
                      className="text-foreground block text-xs font-medium"
                      htmlFor="edit-task-status"
                    >
                      Status
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="border-border/70 bg-muted/25 text-foreground hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-ring/40 h-10 w-full justify-between rounded-lg border px-3 text-sm font-normal shadow-none outline-none focus-visible:ring-2"
                          disabled={isSaving || task?.status === 'DONE'}
                          id="edit-task-status"
                          type="button"
                          variant="outline"
                        >
                          <span className="truncate">{STATUS_LABELS[editStatus]}</span>
                          <ChevronDown
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-56">
                        <DropdownMenuRadioGroup
                          onValueChange={(value) => {
                            setValue('status', value as TaskStatus, { shouldValidate: true });
                          }}
                          value={editStatus}
                        >
                          <DropdownMenuRadioItem value="TODO">To Do</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="IN_PROGRESS">
                            In Progress
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="BLOCKED">Blocked</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="DONE">Done</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {errors.status ? (
                      <p className="text-destructive text-xs" role="alert">
                        {errors.status.message}
                      </p>
                    ) : null}
                  </div>
                  {assigneeEditable ? (
                    <div className="col-span-12 space-y-1 sm:col-span-6">
                      <label
                        className="text-foreground block text-xs font-medium"
                        htmlFor="edit-task-assigned-to"
                      >
                        Assign to
                      </label>
                      <Controller
                        control={control}
                        name="assignedTo"
                        render={({ field }) => {
                          const selectValue =
                            field.value.length > 0
                              ? field.value
                              : ASSIGNED_TO_NONE_SELECT_VALUE;
                          return (
                            <Select
                              disabled={isSaving || assignableTenantUsersLoading}
                              onValueChange={(next) => {
                                field.onChange(
                                  next === ASSIGNED_TO_NONE_SELECT_VALUE ? '' : next,
                                );
                              }}
                              value={selectValue}
                            >
                              <SelectTrigger
                                className="border-border/70 bg-muted/25 text-foreground focus-visible:border-ring focus-visible:ring-ring/40 h-10 w-full rounded-lg text-sm outline-none focus-visible:ring-2"
                                id="edit-task-assigned-to"
                              >
                                <SelectValue placeholder="Choose a tenant user…" />
                              </SelectTrigger>
                              <SelectContent align="start" className="max-h-60">
                                <SelectItem value={ASSIGNED_TO_NONE_SELECT_VALUE}>
                                  Unassigned
                                </SelectItem>
                                {field.value.length > 0 &&
                                !assignableTenantUsers.some((u) => u.id === field.value) ? (
                                  <SelectItem value={field.value}>
                                    Current assignee (not in user list)
                                  </SelectItem>
                                ) : null}
                                {assignableTenantUsers.map((user) => {
                                  const primary = tenantUserPrimaryLabel(
                                    user.displayName,
                                    user.email,
                                    'User',
                                  );
                                  const label = user.isActive
                                    ? primary
                                    : `${primary} (inactive)`;
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
                          {assignableTenantUsersError} — assignment is unchanged until you save.
                        </p>
                      ) : null}
                      {errors.assignedTo ? (
                        <p className="text-destructive text-xs" role="alert">
                          {errors.assignedTo.message}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <aside className="border-border/70 min-w-0 space-y-3 lg:border-l lg:pl-8">
                <div className="flex items-center gap-2">
                  <Paperclip className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  <h4 className="text-foreground text-sm font-semibold">Attachment URLs</h4>
                </div>
                <>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {attachmentsEditable
                      ? 'Edit each link below, open in a new tab to verify, or remove a row. Empty rows are ignored when you save.'
                      : 'You can open existing links; only workspace admins can change attachments.'}
                  </p>

                  <ul className="min-w-0 space-y-2">
                    {attachmentsEditable
                      ? fields.map((field, index) => {
                          const rawValue = watch(`attachmentUrls.${index}.url`);
                          const href = tryParseHttpUrl(typeof rawValue === 'string' ? rawValue : '');
                          return (
                            <li
                              className="border-border/70 min-w-0 max-w-full space-y-2 rounded-lg border bg-muted/10 px-3 py-2 text-xs"
                              key={field.id}
                            >
                              <div className="flex min-w-0 max-w-full flex-wrap items-start gap-2">
                                <input
                                  className="border-border/70 bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 min-w-0 max-w-full flex-1 rounded-lg border px-3 py-2 text-xs outline-none focus-visible:ring-2"
                                  disabled={isSaving}
                                  placeholder="https://…"
                                  {...register(`attachmentUrls.${index}.url`)}
                                />
                                <div className="flex shrink-0 items-center gap-1">
                                  {href !== null ? (
                                    <Button
                                      aria-label="Open link in new tab"
                                      asChild
                                      className="size-8"
                                      disabled={isSaving}
                                      size="icon-xs"
                                      type="button"
                                      variant="outline"
                                    >
                                      <a href={href} rel="noreferrer" target="_blank">
                                        <ExternalLink className="size-3.5" aria-hidden />
                                      </a>
                                    </Button>
                                  ) : (
                                    <Button
                                      aria-label="Open link in new tab"
                                      className="size-8"
                                      disabled
                                      size="icon-xs"
                                      type="button"
                                      variant="outline"
                                    >
                                      <ExternalLink className="size-3.5" aria-hidden />
                                    </Button>
                                  )}
                                  <Button
                                    aria-label="Remove attachment URL"
                                    className="size-8 text-destructive hover:text-destructive"
                                    disabled={isSaving}
                                    onClick={() => {
                                      remove(index);
                                    }}
                                    size="icon-xs"
                                    type="button"
                                    variant="ghost"
                                  >
                                    <Trash2 className="size-3.5" aria-hidden />
                                  </Button>
                                </div>
                              </div>
                              {typeof rawValue === 'string' && rawValue.trim().length > 0 ? (
                                <AttachmentImagePreview url={rawValue} />
                              ) : null}
                              {errors.attachmentUrls?.[index]?.url?.message ? (
                                <p className="text-destructive text-xs" role="alert">
                                  {errors.attachmentUrls[index]?.url?.message}
                                </p>
                              ) : null}
                            </li>
                          );
                        })
                      : (task?.attachmentUrls ?? []).length > 0
                        ? (task?.attachmentUrls ?? []).map((url) => {
                            const href = tryParseHttpUrl(url);
                            return (
                              <li
                                className="border-border/70 flex min-w-0 max-w-full flex-col gap-2 rounded-lg border bg-muted/10 px-3 py-2 text-xs"
                                key={url}
                              >
                                {href !== null ? (
                                  <Button
                                    asChild
                                    className="h-9 w-full max-w-full justify-start gap-2 px-3 sm:w-fit"
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    <a href={href} rel="noreferrer" target="_blank" title={url}>
                                      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                                      <span className="min-w-0 truncate">Open attachment</span>
                                    </a>
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground max-w-full [overflow-wrap:anywhere] break-words">
                                    {url}
                                  </span>
                                )}
                                {url.trim().length > 0 ? <AttachmentImagePreview url={url} /> : null}
                              </li>
                            );
                          })
                        : (
                            <li className="text-muted-foreground text-xs">
                              No attachments on this task.
                            </li>
                          )}
                  </ul>

                  {attachmentsEditable ? (
                    <>
                      <Button
                        className="w-full sm:w-auto"
                        disabled={isSaving || fields.length >= 50}
                        onClick={() => {
                          append({ url: '' });
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Plus className="size-4" aria-hidden />
                        Add URL
                      </Button>
                      {errors.attachmentUrls &&
                      typeof errors.attachmentUrls === 'object' &&
                      'message' in errors.attachmentUrls &&
                      typeof errors.attachmentUrls.message === 'string' ? (
                        <p className="text-destructive text-xs" role="alert">
                          {errors.attachmentUrls.message}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </>
              </aside>
            </div>
          </div>

          <DialogFooter className="border-border/70 shrink-0 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
            <Button
              disabled={isSaving}
              onClick={() => {
                onOpenChange(false);
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
