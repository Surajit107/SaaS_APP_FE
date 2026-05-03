import { Loader2, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type TaskDeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string | null;
  isDeleting: boolean;
  onConfirmDelete: () => void;
};

export function TaskDeleteConfirmDialog({
  open,
  onOpenChange,
  taskTitle,
  isDeleting,
  onConfirmDelete,
}: TaskDeleteConfirmDialogProps) {
  const titleLabel = taskTitle !== null && taskTitle.trim().length > 0 ? taskTitle : 'this task';

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent size="default">
        <AlertDialogHeader className="sm:text-left">
          <AlertDialogTitle>Delete task?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block">
              This will permanently delete{' '}
              <span className="text-foreground font-medium">&quot;{titleLabel}&quot;</span>.
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel disabled={isDeleting} type="button">
            Cancel
          </AlertDialogCancel>
          <Button
            disabled={isDeleting}
            onClick={() => {
              onConfirmDelete();
            }}
            type="button"
            variant="destructive"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-4" aria-hidden />
            )}
            Delete task
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
