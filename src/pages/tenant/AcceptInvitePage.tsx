import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeClosed,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';

import { tenantAcceptInviteRequested } from '@/features/tenant/saga/tenantAuthSaga';
import {
  clearAcceptInviteError,
  resetAcceptInviteUiState,
} from '@/features/tenant/slice/tenantAuthSlice';
import { AuthCardTopHome } from '@/components/auth/AuthCardTopHome';
import { Button } from '@/components/ui/button';
import { authInputClassName } from '@/lib/validation/authFieldStyles';
import {
  acceptInviteSchema,
  type AcceptInviteFormValues,
} from '@/lib/validation/authSchemas';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

// ─── Sub-views ────────────────────────────────────────────────────────────────

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="from-muted/35 relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b via-background to-background px-3 py-8 sm:px-4 sm:py-12">
      <div
        aria-hidden
        className="bg-primary/10 absolute -left-14 top-20 h-40 w-40 rounded-full blur-3xl"
      />
      <div className="border-primary/20 relative w-full max-w-xl overflow-hidden rounded-2xl border bg-card shadow-lg shadow-black/5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.1] via-primary/[0.02] to-transparent"
        />
        <AuthCardTopHome />
        {children}
      </div>
    </div>
  );
}

function InvalidLinkView() {
  return (
    <CardShell>
      <div className="relative z-10 px-4 py-10 text-center sm:px-8 sm:py-12">
        <div className="bg-destructive/10 text-destructive mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full">
          <AlertCircle size={26} strokeWidth={1.5} />
        </div>
        <h1 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
          Invalid invitation link
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          This link is missing required parameters. Check the link in your
          invitation email or ask your administrator to resend the invitation.
        </p>
        <Link
          className="text-primary mt-6 inline-block text-sm font-medium hover:underline hover:underline-offset-4"
          to="/tenant/user/login"
        >
          Go to sign in →
        </Link>
      </div>
    </CardShell>
  );
}

function SuccessView({ email }: { email: string }) {
  return (
    <CardShell>
      <div className="relative z-10 px-4 py-10 text-center sm:px-8 sm:py-12">
        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full">
          <CheckCircle2 size={26} strokeWidth={1.5} />
        </div>
        <h1 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
          Account activated!
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Your password has been set. Sign in with{' '}
          <span className="text-foreground font-medium">{email}</span> to access
          your workspace.
        </p>
        <Link
          className="mt-6 block"
          state={{ registeredEmail: email }}
          to="/tenant/user/login"
        >
          <Button className="w-full" size="lg">
            Sign in to workspace
          </Button>
        </Link>
      </div>
    </CardShell>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AcceptInvitePage() {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const emailFromUrl = (searchParams.get('email') ?? '').trim().toLowerCase();

  const { acceptInviteLoading, acceptInviteError, acceptInviteSucceeded } =
    useAppSelector((s) => s.tenantAuth);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const hasValidParams = token.length > 0 && emailFromUrl.length > 0;

  const inviteKeyRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
  });

  /**
   * Fresh UI when the invite link identity changes (new token / email in URL).
   * Intentionally does not run on every mount with the same key — otherwise a successful
   * activation would be wiped before the success view paints (Strict Mode re-runs effects).
   */
  useEffect(() => {
    if (!hasValidParams) {
      inviteKeyRef.current = null;
      return;
    }
    const key = `${emailFromUrl}\0${token}`;
    if (inviteKeyRef.current === key) return;
    inviteKeyRef.current = key;
    dispatch(resetAcceptInviteUiState());
  }, [dispatch, hasValidParams, token, emailFromUrl]);

  if (!hasValidParams) return <InvalidLinkView />;
  if (acceptInviteSucceeded) return <SuccessView email={emailFromUrl} />;

  const isBusy = isSubmitting || acceptInviteLoading;

  const onSubmit = (values: AcceptInviteFormValues) => {
    dispatch(
      tenantAcceptInviteRequested({
        email: emailFromUrl,
        token,
        password: values.password,
      }),
    );
  };

  return (
    <CardShell>
      {/* Header */}
      <div className="relative z-10 px-4 pb-5 pt-6 sm:px-8">
        <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]">
          <KeyRound size={13} strokeWidth={2} />
          You've been invited
        </div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Set your password
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          You're joining as{' '}
          <span className="text-foreground font-medium">{emailFromUrl}</span>.
          Set a strong password to activate your account.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="bg-background/80 text-muted-foreground inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[11px]">
            <ShieldCheck size={12} strokeWidth={2} />
            One-time activation link
          </span>
        </div>
      </div>

      {/* Form */}
      <form
        className="relative z-10 space-y-4 px-4 pb-4 sm:px-8"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Email — readonly */}
        <div className="block space-y-2">
          <label
            className="text-foreground block text-xs font-medium"
            htmlFor="accept-email"
          >
            Email
          </label>
          <input
            id="accept-email"
            className="border-input bg-muted text-muted-foreground h-10 w-full cursor-not-allowed rounded-lg border px-3 text-sm shadow-xs outline-none"
            readOnly
            tabIndex={-1}
            type="email"
            value={emailFromUrl}
          />
        </div>

        {/* Password */}
        <div className="block space-y-2">
          <label
            className="text-foreground block text-xs font-medium"
            htmlFor="accept-password"
          >
            Password
            <span className="text-muted-foreground ml-1 font-normal">(min. 8 chars)</span>
          </label>
          <div className="relative">
            <input
              id="accept-password"
              autoComplete="new-password"
              className={`${authInputClassName(!!errors.password)} pr-11`}
              placeholder="••••••••"
              type={isPasswordVisible ? 'text' : 'password'}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'accept-password-err' : undefined}
              {...register('password', {
                onChange: () => {
                  dispatch(clearAcceptInviteError());
                },
              })}
            />
            <button
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              className="text-muted-foreground hover:text-foreground hover:bg-muted absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 transition-colors"
              onClick={() => {
                setIsPasswordVisible((p) => !p);
              }}
              type="button"
            >
              {isPasswordVisible ? (
                <EyeClosed size={16} strokeWidth={1.8} />
              ) : (
                <Eye size={16} strokeWidth={1.8} />
              )}
            </button>
          </div>
          {errors.password ? (
            <p id="accept-password-err" className="text-destructive text-xs" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {/* Confirm password */}
        <div className="block space-y-2">
          <label
            className="text-foreground block text-xs font-medium"
            htmlFor="accept-confirm"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="accept-confirm"
              autoComplete="new-password"
              className={`${authInputClassName(!!errors.confirmPassword)} pr-11`}
              placeholder="••••••••"
              type={isConfirmVisible ? 'text' : 'password'}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'accept-confirm-err' : undefined}
              {...register('confirmPassword', {
                onChange: () => {
                  dispatch(clearAcceptInviteError());
                },
              })}
            />
            <button
              aria-label={isConfirmVisible ? 'Hide password' : 'Show password'}
              className="text-muted-foreground hover:text-foreground hover:bg-muted absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 transition-colors"
              onClick={() => {
                setIsConfirmVisible((p) => !p);
              }}
              type="button"
            >
              {isConfirmVisible ? (
                <EyeClosed size={16} strokeWidth={1.8} />
              ) : (
                <Eye size={16} strokeWidth={1.8} />
              )}
            </button>
          </div>
          {errors.confirmPassword ? (
            <p id="accept-confirm-err" className="text-destructive text-xs" role="alert">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <Button className="mt-2 w-full" disabled={isBusy} size="lg" type="submit">
          {acceptInviteLoading ? 'Activating account…' : 'Activate account'}
        </Button>

        {acceptInviteError ? (
          <p className="text-destructive text-xs" role="alert">
            {acceptInviteError}
          </p>
        ) : null}
      </form>

      {/* Footer */}
      <p className="text-muted-foreground relative z-10 border-t border-border/50 px-4 py-4 text-center text-xs leading-relaxed sm:px-8">
        Already have an account?{' '}
        <Link
          className="text-primary cursor-pointer font-medium hover:underline hover:underline-offset-4"
          to="/tenant/user/login"
        >
          Sign in
        </Link>
      </p>
    </CardShell>
  );
}
