import { Loader2, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WorkspaceDeleteDialogProps {
  open: boolean;
  isDeleting: boolean;
  workspaceName: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
}

export function WorkspaceDeleteDialog({
  open,
  isDeleting,
  workspaceName,
  onOpenChange,
  onConfirmDelete,
}: WorkspaceDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={isDeleting ? undefined : onOpenChange}>
      <AlertDialogContent size="default">
        <AlertDialogHeader className="sm:text-left">
          <AlertDialogMedia className="bg-destructive/10">
            <Trash2 className="size-5 text-destructive" aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
          <AlertDialogDescription>
            {workspaceName !== null ? (
              <>
                You are about to permanently delete{' '}
                <span className="text-foreground font-medium">
                  &ldquo;{workspaceName}&rdquo;
                </span>
                . This action cannot be undone.
              </>
            ) : (
              'This workspace will be permanently deleted. This action cannot be undone.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={(e) => {
              e.preventDefault();
              onConfirmDelete();
            }}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-4" aria-hidden />
            )}
            {isDeleting ? 'Deleting…' : 'Delete workspace'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
