import { useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  tenantUserAdminDeleteFlowRequested,
  tenantUserAdminDetailSheetClosed,
  tenantUserAdminUpdateFlowRequested,
} from '@/features/tenant/slice/tenantUserAdminSlice';
import { tenantUserPrimaryLabel } from '@/lib/tenant/tenantIdentityDisplay';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function TenantUserDetailSheet() {
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((s) => s.tenantAuth.userId);
  const {
    detailOpen,
    detail,
    detailLoading,
    detailError,
    updateSubmitting,
    deleteSubmitting,
  } = useAppSelector((s) => s.tenantUserAdmin);

  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [isActive, setIsActive] = useState(true);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  useEffect(() => {
    if (detail) {
      setDisplayName(detail.displayName?.trim() ?? '');
      setRole(detail.role);
      setIsActive(detail.isActive);
    }
  }, [detail]);

  useEffect(() => {
    if (!detailOpen) {
      setDeleteAlertOpen(false);
    }
  }, [detailOpen]);

  const handleSheetOpenChange = (open: boolean): void => {
    if (!open && !updateSubmitting && !deleteSubmitting) {
      dispatch(tenantUserAdminDetailSheetClosed());
    }
  };

  const isSelf = currentUserId !== null && detail !== null && detail.id === currentUserId;

  const handleSave = (): void => {
    if (!detail) {
      return;
    }
    dispatch(
      tenantUserAdminUpdateFlowRequested({
        userId: detail.id,
        displayName: displayName.trim(),
        role,
        isActive,
      }),
    );
  };

  const handleConfirmDelete = (): void => {
    if (!detail || isSelf) {
      return;
    }
    setDeleteAlertOpen(false);
    dispatch(tenantUserAdminDeleteFlowRequested({ userId: detail.id }));
  };

  const primaryLabel =
    detail !== null ? tenantUserPrimaryLabel(detail.displayName, detail.email, 'User') : 'User';

  return (
    <>
      <Sheet onOpenChange={handleSheetOpenChange} open={detailOpen}>
        <SheetContent className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto">
          <SheetHeader className="border-border/60 border-b pb-4">
            <SheetTitle>User details</SheetTitle>
            <SheetDescription>
              View and edit this organisation account. Changes apply immediately after save.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 px-4 py-4">
            {detailLoading && detail === null ? (
              <div aria-busy aria-label="Loading user details" className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48 max-w-full" />
                  <Skeleton className="h-3 w-full max-w-xs" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-9 flex-1 rounded-md" />
                  <Skeleton className="h-9 flex-1 rounded-md" />
                </div>
              </div>
            ) : null}
            {detailError !== null && detail === null ? (
              <div className="border-destructive/40 bg-destructive/10 rounded-lg border px-3 py-2 text-sm">
                <p className="text-destructive font-medium">{detailError}</p>
              </div>
            ) : null}
            {detail !== null ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-foreground text-sm font-medium">{primaryLabel}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{detail.email}</p>
                  {isSelf ? (
                    <p className="text-muted-foreground mt-2 text-xs">
                      This is your account — you cannot delete it from here.
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-1.5">
                  <label className="text-foreground text-xs font-medium" htmlFor="detail-display">
                    Display name
                  </label>
                  <Input
                    disabled={updateSubmitting}
                    id="detail-display"
                    maxLength={120}
                    onChange={(ev) => {
                      setDisplayName(ev.target.value);
                    }}
                    placeholder="Display name"
                    type="text"
                    value={displayName}
                  />
                </div>

                <div className="grid gap-1.5">
                  <span className="text-foreground text-xs font-medium" id="detail-role-label">
                    Role
                  </span>
                  <Select
                    disabled={updateSubmitting || isSelf}
                    onValueChange={(value) => {
                      setRole(value === 'admin' ? 'admin' : 'member');
                    }}
                    value={role}
                  >
                    <SelectTrigger aria-labelledby="detail-role-label" id="detail-role">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSelf ? (
                    <p className="text-muted-foreground text-xs">
                      You cannot change your own role from this screen.
                    </p>
                  ) : null}
                </div>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    checked={isActive}
                    className="border-border text-primary focus-visible:ring-ring size-4 rounded border"
                    disabled={updateSubmitting || isSelf}
                    onChange={(ev) => {
                      setIsActive(ev.target.checked);
                    }}
                    type="checkbox"
                  />
                  <span className="text-foreground text-sm font-medium">Active account</span>
                </label>
                {isSelf ? (
                  <p className="text-muted-foreground text-xs">
                    Deactivating your own account is not supported here.
                  </p>
                ) : null}

                <dl className="text-muted-foreground grid gap-2 border-t pt-3 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt>User ID</dt>
                    <dd className="text-foreground font-mono text-[0.65rem] break-all">{detail.id}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Email verified</dt>
                    <dd className="text-foreground">{detail.isEmailVerified ? 'Yes' : 'No'}</dd>
                  </div>
                  {detail.createdAt !== undefined ? (
                    <div className="flex justify-between gap-2">
                      <dt>Joined</dt>
                      <dd className="text-foreground">
                        {new Date(detail.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}
          </div>

          <SheetFooter className="border-border/60 mt-auto flex-col gap-2 border-t sm:flex-col">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                disabled={detail === null || updateSubmitting || deleteSubmitting}
                onClick={handleSave}
                type="button"
              >
                {updateSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
              <Button
                disabled={detail === null || isSelf || deleteSubmitting || updateSubmitting}
                onClick={() => {
                  setDeleteAlertOpen(true);
                }}
                type="button"
                variant="destructive"
              >
                Delete user
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog onOpenChange={setDeleteAlertOpen} open={deleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the account from your organisation. Pending invitations for
              this email are removed as well. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} type="button" variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
