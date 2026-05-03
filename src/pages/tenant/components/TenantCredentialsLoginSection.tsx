import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeClosed } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { tenantLoginRequested } from '@/features/tenant/saga/tenantAuthSaga';
import { clearError } from '@/features/tenant/slice/tenantAuthSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { authInputClassName } from '@/lib/validation/authFieldStyles';
import type { TenantLoginPortalRole } from '@/lib/api/types/payloads';
import {
  type LoginFormValues,
  loginSchema,
} from '@/lib/validation/authSchemas';

export type TenantCredentialsLoginSectionProps = {
  /** Prefix for stable `id` / `aria-describedby` across org vs member pages. */
  idPrefix: string;
  /** Sent to the API as `tenantRole` — must match the user’s org role for this page. */
  loginTenantRole: TenantLoginPortalRole;
  initialEmail?: string;
};

export function TenantCredentialsLoginSection({
  idPrefix,
  loginTenantRole,
  initialEmail = '',
}: TenantCredentialsLoginSectionProps) {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.tenantAuth);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: initialEmail, password: '' },
  });

  useEffect(() => {
    reset({ email: initialEmail, password: '' });
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

  const onSubmit = (values: LoginFormValues): void => {
    dispatch(
      tenantLoginRequested({
        email: values.email,
        password: values.password,
        tenantRole: loginTenantRole,
      }),
    );
  };


  const emailFieldId = `${idPrefix}-login-email`;
  const passwordFieldId = `${idPrefix}-login-password`;

  return (
    <form
      className="relative z-10 space-y-3 px-4 pb-3 sm:px-8"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="block space-y-2">
        <label className="text-foreground block text-xs font-medium" htmlFor={emailFieldId}>
          Email
        </label>
        <input
          id={emailFieldId}
          autoComplete="email"
          className={authInputClassName(!!errors.email)}
          placeholder="you@team.com"
          type="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `${emailFieldId}-err` : undefined}
          {...register('email')}
        />
        {errors.email ? (
          <p id={`${emailFieldId}-err`} className="text-destructive text-xs" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="block space-y-2">
        <label className="text-foreground block text-xs font-medium" htmlFor={passwordFieldId}>
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
            {...register('password')}
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
      <Button
        className="mt-1 w-full"
        disabled={isSubmitting || isLoading}
        size="default"
        type="submit"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
