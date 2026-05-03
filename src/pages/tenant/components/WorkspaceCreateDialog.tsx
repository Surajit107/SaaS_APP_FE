import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(128, 'Name must be 128 characters or fewer'),
});

type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;

interface WorkspaceCreateDialogProps {
  open: boolean;
  isCreating: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
  /** When true, resets the form (called after successful creation). */
  lastCreateSucceededAt: number | null;
}

export function WorkspaceCreateDialog({
  open,
  isCreating,
  onOpenChange,
  onCreate,
  lastCreateSucceededAt,
}: WorkspaceCreateDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (lastCreateSucceededAt !== null) {
      reset();
      onOpenChange(false);
    }
  }, [lastCreateSucceededAt, reset, onOpenChange]);

  const handleOpenChange = (next: boolean): void => {
    if (isCreating) return;
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New workspace</DialogTitle>
          <DialogDescription>
            Give your workspace a clear name. Admins can delete workspaces later.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          noValidate
          onSubmit={handleSubmit(({ name }) => onCreate(name))}
        >
          <div className="grid gap-1.5">
            <label
              className="text-foreground text-xs font-medium"
              htmlFor="workspace-name"
            >
              Name
            </label>
            <Input
              id="workspace-name"
              placeholder="e.g. Product Roadmap"
              disabled={isCreating}
              aria-invalid={errors.name !== undefined}
              {...register('name')}
            />
            {errors.name !== undefined ? (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            ) : null}
          </div>

          <DialogFooter className="mt-2 flex flex-row justify-end gap-3 border-t border-border/60 pt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isCreating}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Creating…
                </>
              ) : (
                'Create workspace'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
