import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldOff, TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  issuedBackupCodesDismissed,
  securityDialogReset,
  tenantBackupCodesRegenerateRequested,
  tenantEmailCodeLoginPreferenceRequested,
  tenantMfaStatusSyncRequested,
  tenantTotpDisableRequested,
  tenantTotpEnableRequested,
  tenantTotpSetupRequested,
} from '@/features/tenant/slice/tenantSecuritySlice';
import { BackupCodesPanel } from '@/pages/tenant/components/security/BackupCodesPanel';
import { PasswordConfirmPanel } from '@/pages/tenant/components/security/PasswordConfirmPanel';
import { TotpEnrollmentPanel } from '@/pages/tenant/components/security/TotpEnrollmentPanel';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/** Recovery codes left before we start nudging the user to make more. */
const LOW_BACKUP_CODE_THRESHOLD = 3;

interface TenantSecurityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string | null;
}

type ConfirmIntent = 'disable' | 'regenerate';

/** Self-service two-factor authentication: enroll, recovery codes, turn off. */
export function TenantSecurityDialog({
  open,
  onOpenChange,
  email,
}: TenantSecurityDialogProps) {
  const dispatch = useAppDispatch();
  const {
    status,
    isStatusLoading,
    statusError,
    enrollment,
    isEnrollmentStarting,
    isEnabling,
    isDisabling,
    isRegenerating,
    isPreferenceSaving,
    actionError,
    issuedBackupCodes,
  } = useAppSelector((s) => s.tenantSecurity);

  const [confirmIntent, setConfirmIntent] = useState<ConfirmIntent | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setConfirmIntent(null);
      dispatch(securityDialogReset());
      dispatch(tenantMfaStatusSyncRequested());
    }
    wasOpenRef.current = open;
  }, [open, dispatch]);

  const closeDialog = (next: boolean): void => {
    if (!next) {
      setConfirmIntent(null);
      dispatch(securityDialogReset());
    }
    onOpenChange(next);
  };

  const isTotpEnabled = status?.isTotpEnabled === true;
  const backupCodesRemaining = status?.backupCodesRemaining ?? 0;

  const panel: 'codes' | 'enroll' | ConfirmIntent | 'overview' =
    issuedBackupCodes !== null
      ? 'codes'
      : enrollment !== null
        ? 'enroll'
        : (confirmIntent ?? 'overview');

  return (
    <Dialog onOpenChange={closeDialog} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck aria-hidden className="text-primary size-5" />
            {panelTitle(panel)}
          </DialogTitle>
          <DialogDescription>{panelDescription(panel)}</DialogDescription>
        </DialogHeader>

        {panel === 'codes' && issuedBackupCodes !== null ? (
          <BackupCodesPanel
            accountEmail={email}
            codes={issuedBackupCodes}
            onDone={() => {
              // Clears the confirm step that produced these codes, so dismissing
              // them lands back on the overview rather than the password prompt.
              setConfirmIntent(null);
              dispatch(issuedBackupCodesDismissed());
            }}
          />
        ) : null}

        {panel === 'enroll' && enrollment !== null ? (
          <TotpEnrollmentPanel
            enrollment={enrollment}
            error={actionError}
            isEnabling={isEnabling}
            onCancel={() => {
              dispatch(securityDialogReset());
            }}
            onConfirm={(code) => {
              dispatch(tenantTotpEnableRequested({ code }));
            }}
          />
        ) : null}

        {panel === 'disable' ? (
          <PasswordConfirmPanel
            description="Confirm it is you. Your account keeps password-only sign-in afterwards, and you will be signed out everywhere."
            destructive
            error={actionError}
            idPrefix="tenant-security-disable"
            isSubmitting={isDisabling}
            onCancel={() => {
              setConfirmIntent(null);
            }}
            onSubmit={({ password, code }) => {
              dispatch(tenantTotpDisableRequested({ password, code }));
            }}
            pendingLabel="Turning off…"
            requireCode
            submitLabel="Turn off two-factor"
          />
        ) : null}

        {panel === 'regenerate' ? (
          <PasswordConfirmPanel
            description="Your current recovery codes stop working as soon as the new ones are issued."
            error={actionError}
            idPrefix="tenant-security-regenerate"
            isSubmitting={isRegenerating}
            onCancel={() => {
              setConfirmIntent(null);
            }}
            onSubmit={({ password }) => {
              dispatch(tenantBackupCodesRegenerateRequested({ password }));
            }}
            pendingLabel="Generating…"
            requireCode={false}
            submitLabel="Generate new codes"
          />
        ) : null}

        {panel === 'overview' ? (
          <div className="space-y-4">
            {isStatusLoading && status === null ? (
              <p className="text-muted-foreground text-sm">
                Loading security settings...
              </p>
            ) : null}

            {statusError !== null ? (
              <p className="text-destructive text-sm" role="alert">
                {statusError}
              </p>
            ) : null}

            {status !== null ? (
              <div className="border-border bg-muted/30 space-y-3 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-foreground text-sm font-medium">
                      Authenticator app
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {isTotpEnabled
                        ? 'A 6-digit code is required every time you sign in.'
                        : 'Add a 6-digit code from an authenticator app on top of your password.'}
                    </p>
                  </div>
                  <Badge variant={isTotpEnabled ? 'default' : 'secondary'}>
                    {isTotpEnabled ? 'On' : 'Off'}
                  </Badge>
                </div>

                {isTotpEnabled ? (
                  <dl className="space-y-2 text-sm">
                    {status.totpEnabledAt !== null ? (
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                          Turned on
                        </dt>
                        <dd className="text-foreground">
                          {new Date(status.totpEnabledAt).toLocaleDateString(
                            undefined,
                            { year: 'numeric', month: 'short', day: 'numeric' },
                          )}
                        </dd>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                        Recovery codes left
                      </dt>
                      <dd className="text-foreground">{backupCodesRemaining}</dd>
                    </div>
                  </dl>
                ) : null}

                {isTotpEnabled &&
                backupCodesRemaining < LOW_BACKUP_CODE_THRESHOLD ? (
                  <div className="border-destructive/30 bg-destructive/5 flex items-start gap-2 rounded-lg border p-2.5">
                    <TriangleAlert
                      aria-hidden
                      className="text-destructive mt-0.5 size-4 shrink-0"
                    />
                    <p className="text-foreground text-xs leading-snug">
                      {backupCodesRemaining === 0
                        ? 'You have no recovery codes left. Generate a new set so you can get in without your authenticator app.'
                        : 'You are running low on recovery codes. Generate a new set to be safe.'}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {isTotpEnabled ? (
                    <>
                      <Button
                        disabled={isRegenerating}
                        onClick={() => {
                          setConfirmIntent('regenerate');
                        }}
                        size="lg"
                        type="button"
                        variant="outline"
                      >
                        New recovery codes
                      </Button>
                      <Button
                        onClick={() => {
                          setConfirmIntent('disable');
                        }}
                        size="lg"
                        type="button"
                        variant="destructive"
                      >
                        <ShieldOff aria-hidden />
                        Turn off
                      </Button>
                    </>
                  ) : (
                    <Button
                      disabled={isEnrollmentStarting}
                      onClick={() => {
                        dispatch(tenantTotpSetupRequested());
                      }}
                      size="lg"
                      type="button"
                    >
                      {isEnrollmentStarting
                        ? 'Preparing…'
                        : 'Set up authenticator app'}
                    </Button>
                  )}
                </div>

                {actionError !== null ? (
                  <p className="text-destructive text-xs" role="alert">
                    {actionError}
                  </p>
                ) : null}
              </div>
            ) : null}

            {status !== null ? (
              <div className="border-border bg-muted/30 flex items-start justify-between gap-3 rounded-xl border p-4">
                <div className="min-w-0">
                  <label
                    className="text-foreground text-sm font-medium"
                    htmlFor="tenant-security-email-code"
                  >
                    Sign in with an emailed code
                  </label>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Lets you sign in with a one-time code sent to{' '}
                    {email ?? 'your email'} instead of your password. Because
                    the code proves you control the inbox, it also stands in for
                    your authenticator app.
                  </p>
                </div>
                <Switch
                  aria-label="Sign in with an emailed code"
                  checked={status.isEmailCodeLoginEnabled}
                  disabled={isPreferenceSaving}
                  id="tenant-security-email-code"
                  onCheckedChange={(next) => {
                    dispatch(
                      tenantEmailCodeLoginPreferenceRequested({
                        isEmailCodeLoginEnabled: next,
                      }),
                    );
                  }}
                />
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  closeDialog(false);
                }}
                size="lg"
                type="button"
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function panelTitle(panel: 'codes' | 'enroll' | ConfirmIntent | 'overview'): string {
  switch (panel) {
    case 'codes':
      return 'Recovery codes';
    case 'enroll':
      return 'Set up authenticator app';
    case 'disable':
      return 'Turn off two-factor authentication';
    case 'regenerate':
      return 'New recovery codes';
    default:
      return 'Security';
  }
}

function panelDescription(
  panel: 'codes' | 'enroll' | ConfirmIntent | 'overview',
): string {
  switch (panel) {
    case 'codes':
      return 'Store these somewhere safe. This is the only time they are shown.';
    case 'enroll':
      return 'Scan the QR code, then confirm the code your app generates.';
    case 'disable':
      return 'This removes the second step from every sign-in on this account.';
    case 'regenerate':
      return 'Replaces your existing recovery codes with a fresh set.';
    default:
      return 'Add a second step to your sign-in and manage your recovery codes.';
  }
}
