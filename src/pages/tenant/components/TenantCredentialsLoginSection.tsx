import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeClosed, KeyRound, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  tenantLoginCodeRequested,
  tenantLoginRequested,
} from '@/features/tenant/saga/tenantAuthSaga';
import { clearError } from '@/features/tenant/slice/tenantAuthSlice';
import { TenantMfaChallengeSection } from '@/pages/tenant/components/TenantMfaChallengeSection';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { authInputClassName } from '@/lib/validation/authFieldStyles';
import type { TenantLoginPortalRole } from '@/lib/api/types/payloads';
import {
  type LoginFormValues,
  loginEmailSchema,
  loginSchema,
} from '@/lib/validation/authSchemas';

export type TenantCredentialsLoginSectionProps = {
  /** Prefix for stable `id` / `aria-describedby` across org vs member pages. */
  idPrefix: string;
  /** Sent to the API as `tenantRole` — must match the user’s org role for this page. */
  loginTenantRole: TenantLoginPortalRole;
  initialEmail?: string;
};

type LoginMethodStep = 'identify' | 'choose' | 'password';

export function TenantCredentialsLoginSection({
  idPrefix,
  loginTenantRole,
  initialEmail = '',
}: TenantCredentialsLoginSectionProps) {
  const dispatch = useAppDispatch();
  const { isLoading, error, mfaChallenge, isLoginCodeRequestPending } =
    useAppSelector((s) => s.tenantAuth);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [step, setStep] = useState<LoginMethodStep>(() =>
    isEmailLike(initialEmail) ? 'choose' : 'identify',
  );
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: initialEmail, password: '' },
  });
  const { ref: emailRegisterRef, ...emailField } = register('email');
  const { ref: passwordRegisterRef, ...passwordField } = register('password');

  useEffect(() => {
    reset({ email: initialEmail, password: '' });
    setStep(isEmailLike(initialEmail) ? 'choose' : 'identify');
  }, [initialEmail, reset]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (error === null) {
      return undefined;
    }

    const subscription = watch(() => {
      dispatch(clearError());
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch, error, watch]);

  useEffect(() => {
    if (mfaChallenge !== null) {
      return;
    }
    if (step === 'identify') {
      emailInputRef.current?.focus();
      return;
    }
    if (step === 'password') {
      passwordInputRef.current?.focus();
    }
  }, [mfaChallenge, step]);

  const emailValue = watch('email');
  const isBusy = isSubmitting || isLoading || isLoginCodeRequestPending;
  const emailFieldId = `${idPrefix}-login-email`;
  const passwordFieldId = `${idPrefix}-login-password`;

  const goToIdentify = (): void => {
    setValue('password', '');
    setIsPasswordVisible(false);
    setStep('identify');
    dispatch(clearError());
  };

  const continueFromEmail = (): void => {
    const parsed = loginEmailSchema.safeParse({ email: getValues('email') });
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? 'Enter a valid email address';
      setError('email', { type: 'manual', message });
      return;
    }
    setValue('email', parsed.data.email);
    dispatch(clearError());
    setStep('choose');
  };

  const requestLoginCode = (): void => {
    const email = emailValue.trim();
    if (!isEmailLike(email)) {
      return;
    }
    dispatch(
      tenantLoginCodeRequested({
        email,
        tenantRole: loginTenantRole,
      }),
    );
  };

  const onPasswordSubmit = (values: LoginFormValues): void => {
    dispatch(
      tenantLoginRequested({
        email: values.email,
        password: values.password,
        tenantRole: loginTenantRole,
      }),
    );
  };

  if (mfaChallenge !== null) {
    return (
      <TenantMfaChallengeSection challenge={mfaChallenge} idPrefix={idPrefix} />
    );
  }

  return (
    <form
      className="relative z-10 space-y-3 px-4 pb-3 sm:px-8"
      noValidate
      onSubmit={
        step === 'password'
          ? handleSubmit(onPasswordSubmit)
          : (event) => {
              event.preventDefault();
              if (step === 'identify') {
                continueFromEmail();
              }
            }
      }
    >
      <div className="block space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <label className="text-foreground text-xs font-medium" htmlFor={emailFieldId}>
            Email
          </label>
          {step !== 'identify' ? (
            <button
              aria-label="Use a different email"
              className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer text-xs hover:underline"
              onClick={goToIdentify}
              type="button"
            >
              Change
            </button>
          ) : null}
        </div>
        <input
          id={emailFieldId}
          autoComplete="username"
          className={`${authInputClassName(!!errors.email)} ${
            step === 'identify' ? '' : 'bg-muted/40'
          }`}
          placeholder="you@team.com"
          type="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `${emailFieldId}-err` : undefined}
          readOnly={step !== 'identify'}
          {...emailField}
          ref={(element) => {
            emailRegisterRef(element);
            emailInputRef.current = element;
          }}
        />
        {errors.email ? (
          <p id={`${emailFieldId}-err`} className="text-destructive text-xs" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      {step === 'identify' ? (
        <Button className="mt-1 w-full" disabled={isBusy} size="default" type="submit">
          Continue
        </Button>
      ) : null}

      {step === 'choose' ? (
        <div className="space-y-3 pt-1">
          <p className="text-foreground text-sm font-medium">How do you want to sign in?</p>
          <Button
            className="w-full gap-2"
            disabled={isBusy}
            onClick={() => {
              setValue('password', '');
              setStep('password');
              dispatch(clearError());
            }}
            size="default"
            type="button"
          >
            <KeyRound aria-hidden className="size-4 shrink-0" />
            Continue with password
          </Button>
          <Button
            className="w-full gap-2"
            disabled={isBusy}
            onClick={requestLoginCode}
            type="button"
            variant="outline"
          >
            <Mail aria-hidden className="size-4 shrink-0" />
            {isLoginCodeRequestPending ? 'Sending code...' : 'Email me a sign-in code'}
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            The emailed code is a one-time password. No password needed.
          </p>
        </div>
      ) : null}

      {step === 'password' ? (
        <>
          <div className="block space-y-2">
            <label
              className="text-foreground block text-xs font-medium"
              htmlFor={passwordFieldId}
            >
              Password
            </label>
            <div className="relative">
              <input
                id={passwordFieldId}
                autoComplete="current-password"
                className={`${authInputClassName(!!errors.password)} pr-11`}
                placeholder="••••••••"
                type={isPasswordVisible ? 'text' : 'password'}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? `${passwordFieldId}-err` : undefined}
                {...passwordField}
                ref={(element) => {
                  passwordRegisterRef(element);
                  passwordInputRef.current = element;
                }}
              />
              <button
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                className="text-muted-foreground hover:text-foreground hover:bg-muted absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 transition-colors"
                onClick={() => setIsPasswordVisible((previous) => !previous)}
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
              <p id={`${passwordFieldId}-err`} className="text-destructive text-xs" role="alert">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          <Button className="mt-1 w-full" disabled={isBusy} size="default" type="submit">
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          <Button
            className="w-full gap-2"
            disabled={isBusy}
            onClick={requestLoginCode}
            type="button"
            variant="outline"
          >
            <Mail aria-hidden className="size-4 shrink-0" />
            {isLoginCodeRequestPending
              ? 'Sending code...'
              : 'Email me a sign-in code instead'}
          </Button>
        </>
      ) : null}

      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function isEmailLike(value: string | undefined): value is string {
  return typeof value === 'string' && /^\S+@\S+\.\S+$/.test(value.trim());
}
