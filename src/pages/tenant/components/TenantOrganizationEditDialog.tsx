import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { tenantOrganizationUpdateRequested } from '@/features/tenant/saga/tenantAuthSaga';
import type { TenantProfile } from '@/lib/api/Api';
import { authInputClassName } from '@/lib/validation/authFieldStyles';
import {
  type TenantOrganizationUpdateFormValues,
  tenantOrganizationUpdateSchema,
} from '@/lib/validation/tenantOrgSchemas';
import { useAppDispatch } from '@/store/hooks';

interface TenantOrganizationEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationNameFallback: string | null;
  tenantProfile: TenantProfile | null;
  isTenantProfileLoading: boolean;
  isTenantUpdateLoading: boolean;
  tenantUpdateError: string | null;
}

export function TenantOrganizationEditDialog({
  open,
  onOpenChange,
  organizationNameFallback,
  tenantProfile,
  isTenantProfileLoading,
  isTenantUpdateLoading,
  tenantUpdateError,
}: TenantOrganizationEditDialogProps) {
  const dispatch = useAppDispatch();
  const prevUpdateLoadingRef = useRef<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TenantOrganizationUpdateFormValues>({
    resolver: zodResolver(tenantOrganizationUpdateSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!open) {
      prevUpdateLoadingRef.current = false;
      return;
    }
    const resolved =
      tenantProfile?.name ??
      (organizationNameFallback !== null ? organizationNameFallback.trim() : '');
    reset({ name: resolved });
  }, [open, tenantProfile?.id, tenantProfile?.name, organizationNameFallback, reset]);

  useEffect(() => {
    const wasLoading = prevUpdateLoadingRef.current;
    prevUpdateLoadingRef.current = isTenantUpdateLoading;
    if (
      open &&
      wasLoading === true &&
      isTenantUpdateLoading === false &&
      tenantUpdateError === null
    ) {
      onOpenChange(false);
    }
  }, [open, isTenantUpdateLoading, tenantUpdateError, onOpenChange]);

  const onSubmit = (values: TenantOrganizationUpdateFormValues): void => {
    const nextName = values.name.trim();
    const previous =
      tenantProfile?.name ??
      (organizationNameFallback !== null ? organizationNameFallback.trim() : '');
    if (nextName === previous) {
      toast.message('No changes to save');
      return;
    }
    dispatch(tenantOrganizationUpdateRequested({ name: nextName }));
  };

  const displayName =
    tenantProfile?.name ?? organizationNameFallback ?? '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="text-primary size-5" aria-hidden />
            Edit organization
          </DialogTitle>
          <DialogDescription>
            Update how your workspace appears in the tenant portal. Changes apply immediately
            after you save.
          </DialogDescription>
        </DialogHeader>
        {isTenantProfileLoading ? (
          <p className="text-muted-foreground text-sm">Loading tenant profile...</p>
        ) : null}
        <form
          className="grid gap-3 py-2"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <label
            className="text-muted-foreground text-xs font-medium uppercase tracking-wide"
            htmlFor="tenant-org-edit-name"
          >
            Organization name
          </label>
          <input
            autoComplete="organization"
            autoFocus
            className={authInputClassName(!!errors.name)}
            disabled={isTenantProfileLoading}
            id="tenant-org-edit-name"
            placeholder={displayName || 'Organization name'}
            type="text"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'tenant-org-edit-name-err' : undefined}
            {...register('name')}
          />
          {errors.name ? (
            <p
              id="tenant-org-edit-name-err"
              className="text-destructive text-xs"
              role="alert"
            >
              {errors.name.message}
            </p>
          ) : null}
          {tenantUpdateError !== null ? (
            <p className="text-destructive text-xs" role="alert">
              {tenantUpdateError}
            </p>
          ) : null}

          <DialogFooter className="mt-4 flex flex-row items-center gap-4 pt-2 sm:justify-end">
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              disabled={isTenantProfileLoading || isTenantUpdateLoading}
              type="submit"
            >
              {isTenantUpdateLoading ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
