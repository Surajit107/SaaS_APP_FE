import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { OtpCodeInput } from '@/components/auth/OtpCodeInput';
import { Button } from '@/components/ui/button';
import { tenantMfaVerifyRequested } from '@/features/tenant/saga/tenantAuthSaga';
import {
  clearMfaError,
  mfaChallengeAbandoned,
} from '@/features/tenant/slice/tenantAuthSlice';
import type { TenantMfaChallenge } from '@/features/tenant/types/tenantAuthSession.types';
import {
  isCompleteBackupCode,
  isCompleteTotpCode,
  normalizeBackupCode,
} from '@/lib/auth/mfa';
import { authInputClassName } from '@/lib/validation/authFieldStyles';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

interface TenantMfaChallengeSectionProps {
  /** Prefix for stable `id` / `aria-describedby` across org vs member pages. */
  idPrefix: string;
  challenge: TenantMfaChallenge;
}

/**
 * Step two of sign-in. Replaces the password form while a challenge is pending;
 * no session exists until the code here is accepted.
 */
export function TenantMfaChallengeSection({
  idPrefix,
  challenge,
}: TenantMfaChallengeSectionProps) {
  const dispatch = useAppDispatch();
  const isMfaVerifying = useAppSelector((s) => s.tenantAuth.isMfaVerifying);
  const mfaError = useAppSelector((s) => s.tenantAuth.mfaError);

  // An emailed code stands alone: there is no authenticator or recovery code to
  // fall back to, so the method switcher has nothing to offer.
  const isEmailCodeChallenge = challenge.methods.includes('email_code');
  const [isUsingBackupCode, setIsUsingBackupCode] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  // Counter exists only to re-render on each tick; the remaining time itself is
  // derived below so it can never drift from the wall clock.
  const [, setTick] = useState(0);
  const secondsLeft = secondsUntil(challenge.expiresAt);

  const codeFieldId = `${idPrefix}-mfa-code`;
  const errorId = `${codeFieldId}-err`;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((previous) => previous + 1);
    }, 1_000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // The server has already dropped the challenge by now, so send the user back
  // rather than let them type a code that cannot succeed.
  useEffect(() => {
    if (secondsLeft !== 0) {
      return;
    }
    toast.info('This sign-in request expired. Please sign in again.');
    dispatch(mfaChallengeAbandoned());
  }, [secondsLeft, dispatch]);

  const submittedCode = isUsingBackupCode
    ? normalizeBackupCode(backupCode)
    : totpCode;
  const canSubmit = isUsingBackupCode
    ? isCompleteBackupCode(backupCode)
    : isCompleteTotpCode(totpCode);

  const submit = useCallback(
    (code: string): void => {
      if (isMfaVerifying || code.length === 0) {
        return;
      }
      dispatch(tenantMfaVerifyRequested({ code }));
    },
    [dispatch, isMfaVerifying],
  );

  const switchMethod = (): void => {
    dispatch(clearMfaError());
    setTotpCode('');
    setBackupCode('');
    setIsUsingBackupCode((previous) => !previous);
  };

  return (
    <form
      className="relative z-10 space-y-3 px-4 pb-3 sm:px-8"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          submit(submittedCode);
        }
      }}
    >
      <div className="border-primary/20 bg-primary/5 flex items-start gap-2 rounded-lg border px-3 py-2">
        <ShieldCheck aria-hidden className="text-primary mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 text-xs leading-snug">
          <p className="text-foreground font-medium">
            {isEmailCodeChallenge
              ? 'Check your email'
              : 'Two-factor authentication'}
          </p>
          <p className="text-muted-foreground break-all">
            {isEmailCodeChallenge
              ? `We sent a code to ${challenge.email}`
              : `Signing in as ${challenge.email}`}
          </p>
        </div>
      </div>

      <div className="block space-y-2">
        <label
          className="text-foreground block text-xs font-medium"
          htmlFor={codeFieldId}
        >
          {isUsingBackupCode
            ? 'Recovery code'
            : isEmailCodeChallenge
              ? 'Emailed code'
              : 'Authenticator code'}
        </label>
        {isUsingBackupCode ? (
          <input
            aria-describedby={mfaError !== null ? errorId : undefined}
            aria-invalid={mfaError !== null}
            autoComplete="one-time-code"
            autoFocus
            className={`${authInputClassName(mfaError !== null)} text-center font-mono tracking-[0.2em] uppercase`}
            disabled={isMfaVerifying}
            id={codeFieldId}
            maxLength={20}
            onChange={(event) => {
              setBackupCode(event.target.value);
            }}
            placeholder="XXXX-XXXX-XXXX"
            type="text"
            value={backupCode}
          />
        ) : (
          <OtpCodeInput
            aria-describedby={mfaError !== null ? errorId : undefined}
            autoFocus
            disabled={isMfaVerifying}
            id={codeFieldId}
            invalid={mfaError !== null}
            onChange={(next) => {
              setTotpCode(next);
            }}
            onComplete={submit}
            value={totpCode}
          />
        )}
        <p className="text-muted-foreground text-xs">
          {isUsingBackupCode
            ? 'Each recovery code works once.'
            : isEmailCodeChallenge
              ? 'Enter the 6-digit code from the email. It works once.'
              : 'Open your authenticator app to get the current 6-digit code.'}
          {secondsLeft !== null && secondsLeft > 0
            ? ` Expires in ${formatCountdown(secondsLeft)}.`
            : ''}
        </p>
        {mfaError !== null ? (
          <p className="text-destructive text-xs" id={errorId} role="alert">
            {mfaError}
          </p>
        ) : null}
      </div>

      <Button
        className="mt-1 w-full"
        disabled={!canSubmit || isMfaVerifying}
        size="default"
        type="submit"
      >
        {isMfaVerifying ? 'Verifying...' : 'Verify and sign in'}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          className="h-8 gap-1 px-2 text-xs"
          disabled={isMfaVerifying}
          onClick={() => {
            dispatch(mfaChallengeAbandoned());
          }}
          type="button"
          variant="ghost"
        >
          <ArrowLeft aria-hidden className="size-3 shrink-0" />
          Back to sign in
        </Button>
        {isEmailCodeChallenge ? null : (
          <Button
            className="h-8 px-2 text-xs"
            disabled={isMfaVerifying}
            onClick={switchMethod}
            type="button"
            variant="ghost"
          >
            {isUsingBackupCode
              ? 'Use my authenticator app'
              : 'Use a recovery code'}
          </Button>
        )}
      </div>
    </form>
  );
}

/** Seconds until expiry, or `null` when the timestamp cannot be read. */
function secondsUntil(isoTimestamp: string): number | null {
  const expiresAtMs = new Date(isoTimestamp).getTime();
  if (!Number.isFinite(expiresAtMs)) {
    return null;
  }
  return Math.max(Math.ceil((expiresAtMs - Date.now()) / 1_000), 0);
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}
