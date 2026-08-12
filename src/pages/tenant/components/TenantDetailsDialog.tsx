import { useEffect, useRef, useState } from 'react';
import { Pencil, ShieldCheck, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { tenantDisplayNameUpdateRequested } from '@/features/tenant/saga/tenantAuthSaga';
import { clearDisplayNameSaveError } from '@/features/tenant/slice/tenantAuthSlice';
import { tenantMfaStatusSyncRequested } from '@/features/tenant/slice/tenantSecuritySlice';
import { DetailCardSection } from '@/pages/tenant/components/DetailCardSection';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const DISPLAY_NAME_MAX = 120;

export type TenantDetailsDialogScope = 'full' | 'accountOnly';

interface TenantDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `full`: admin/workspace view with organization block. `accountOnly`: member profile (display name edit only). */
  scope: TenantDetailsDialogScope;
  email: string | null;
  tenantId: string | null;
  /** Resolved organization name (profile preferred). */
  organizationDisplayName: string | null;
  /** Opens organization edit dialog (PATCH /tenants/me). Omit when scope is accountOnly. */
  onEditOrganization?: () => void;
  /** Opens the two-factor authentication dialog. */
  onManageSecurity: () => void;
  organizationIsActive?: boolean | null;
  isTenantProfileLoading: boolean;
}

export function TenantDetailsDialog({
  open,
  onOpenChange,
  scope,
  email,
  tenantId,
  organizationDisplayName,
  onEditOrganization,
  onManageSecurity,
  organizationIsActive,
  isTenantProfileLoading,
}: TenantDetailsDialogProps) {
  const dispatch = useAppDispatch();
  const displayName = useAppSelector((s) => s.tenantAuth.displayName);
  const isDisplayNameSaving = useAppSelector((s) => s.tenantAuth.isDisplayNameSaving);
  const displayNameSaveError = useAppSelector((s) => s.tenantAuth.displayNameSaveError);
  const mfaStatus = useAppSelector((s) => s.tenantSecurity.status);
  const isMfaStatusLoading = useAppSelector((s) => s.tenantSecurity.isStatusLoading);

  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const displaySaveSubmittedRef = useRef(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setIsEditingDisplayName(false);
      setDisplayNameDraft(displayName ?? '');
      dispatch(clearDisplayNameSaveError());
      dispatch(tenantMfaStatusSyncRequested());
      displaySaveSubmittedRef.current = false;
    }
    wasOpenRef.current = open;
  }, [open, displayName, dispatch]);

  useEffect(() => {
    if (!open) {
      setIsEditingDisplayName(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !isEditingDisplayName) {
      return;
    }
    if (displaySaveSubmittedRef.current && !isDisplayNameSaving && displayNameSaveError === null) {
      displaySaveSubmittedRef.current = false;
      setIsEditingDisplayName(false);
      setDisplayNameDraft(displayName ?? '');
    }
  }, [open, isEditingDisplayName, isDisplayNameSaving, displayNameSaveError, displayName]);

  const startEditDisplayName = (): void => {
    dispatch(clearDisplayNameSaveError());
    displaySaveSubmittedRef.current = false;
    setDisplayNameDraft(displayName ?? '');
    setIsEditingDisplayName(true);
  };

  const cancelEditDisplayName = (): void => {
    dispatch(clearDisplayNameSaveError());
    displaySaveSubmittedRef.current = false;
    setDisplayNameDraft(displayName ?? '');
    setIsEditingDisplayName(false);
  };

  const submitDisplayName = (): void => {
    if (isDisplayNameSaving) {
      return;
    }
    displaySaveSubmittedRef.current = true;
    dispatch(tenantDisplayNameUpdateRequested({ displayName: displayNameDraft.trim() }));
  };

  const showOrganization = scope === 'full';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          dispatch(clearDisplayNameSaveError());
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="text-primary size-5" aria-hidden />
            {scope === 'accountOnly' ? 'Profile' : 'Tenant details'}
          </DialogTitle>
          <DialogDescription>
            {scope === 'accountOnly'
              ? 'Your account in this workspace. Edit your display name below.'
              : 'Account and workspace. Use Edit beside each section to change display name or organization settings separately.'}
          </DialogDescription>
        </DialogHeader>
        {isTenantProfileLoading && showOrganization ? (
          <p className="text-muted-foreground text-sm">Loading tenant profile...</p>
        ) : null}
        <div className="grid gap-3 py-2">
          <DetailCardSection title="Account">
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                    Display name
                  </dt>
                  {!isEditingDisplayName ? (
                    <Button
                      aria-label="Edit display name"
                      className="-mt-1 h-7 gap-1 px-2 text-xs"
                      onClick={startEditDisplayName}
                      type="button"
                      variant="outline"
                    >
                      <Pencil aria-hidden className="size-3 shrink-0" />
                      Edit
                    </Button>
                  ) : null}
                </div>
                {!isEditingDisplayName ? (
                  <dd className="text-foreground mt-1">
                    {displayName !== null && displayName.trim() !== '' ? displayName : '—'}
                  </dd>
                ) : (
                  <div className="mt-2 space-y-2">
                    <Input
                      autoComplete="nickname"
                      disabled={isDisplayNameSaving}
                      id="tenant-details-display-name"
                      maxLength={DISPLAY_NAME_MAX}
                      onChange={(e) => {
                        setDisplayNameDraft(e.target.value);
                      }}
                      placeholder="e.g. Jane Doe"
                      value={displayNameDraft}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        disabled={isDisplayNameSaving}
                        onClick={submitDisplayName}
                        size="sm"
                        type="button"
                      >
                        {isDisplayNameSaving ? 'Saving…' : 'Save'}
                      </Button>
                      <Button
                        disabled={isDisplayNameSaving}
                        onClick={cancelEditDisplayName}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                    {displayNameSaveError !== null ? (
                      <p className="text-destructive text-xs" role="alert">
                        {displayNameSaveError}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Email</dt>
                <dd className="text-foreground mt-1 break-all">{email ?? '—'}</dd>
              </div>
            </dl>
          </DetailCardSection>

          <DetailCardSection
            headerAction={
              <Button
                aria-label="Manage two-factor authentication"
                className="h-7 gap-1 px-2 text-xs"
                onClick={onManageSecurity}
                title="Manage two-factor authentication"
                type="button"
                variant="outline"
              >
                <ShieldCheck aria-hidden className="size-3 shrink-0" />
                Manage
              </Button>
            }
            title="Security"
          >
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                  Two-factor authentication
                </dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2">
                  {mfaStatus === null ? (
                    <span className="text-muted-foreground">
                      {isMfaStatusLoading ? 'Checking...' : '—'}
                    </span>
                  ) : (
                    <>
                      <Badge variant={mfaStatus.isTotpEnabled ? 'default' : 'secondary'}>
                        {mfaStatus.isTotpEnabled ? 'On' : 'Off'}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {mfaStatus.isTotpEnabled
                          ? `Authenticator app · ${String(mfaStatus.backupCodesRemaining)} recovery code${mfaStatus.backupCodesRemaining === 1 ? '' : 's'} left`
                          : 'Protect your account with a 6-digit code'}
                      </span>
                    </>
                  )}
                </dd>
              </div>
            </dl>
          </DetailCardSection>

          {showOrganization ? (
            <DetailCardSection
              headerAction={
                typeof onEditOrganization === 'function' ? (
                  <Button
                    aria-label="Edit organization"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={onEditOrganization}
                    title="Edit organization"
                    type="button"
                    variant="outline"
                  >
                    <Pencil aria-hidden className="size-3 shrink-0" />
                    Edit
                  </Button>
                ) : undefined
              }
              title="Organization"
            >
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                    Tenant id
                  </dt>
                  <dd className="text-foreground mt-1 break-all">{tenantId ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                    Organization name
                  </dt>
                  <dd className="text-foreground mt-1">
                    {organizationDisplayName !== null && organizationDisplayName.trim() !== ''
                      ? organizationDisplayName
                      : '—'}
                  </dd>
                </div>
                {organizationIsActive !== null ? (
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wide">Status</dt>
                    <dd className="text-foreground mt-1 capitalize">
                      {organizationIsActive ? 'Active' : 'Inactive'}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </DetailCardSection>
          ) : null}
        </div>
        <DialogFooter className="flex flex-row items-center justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            size="lg"
            type="button"
            variant="outline"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
