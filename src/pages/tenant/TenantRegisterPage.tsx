import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Eye, EyeClosed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';

import { AuthCardTopHome } from '@/components/auth/AuthCardTopHome';
import { Button } from '@/components/ui/button';
import { TenantAuthPortalFooter } from '@/pages/tenant/components/TenantAuthPortalFooter';
import { tenantRegisterRequested } from '@/features/tenant/saga/tenantAuthSaga';
import {
  clearError,
  clearPostRegisterLoginHint,
} from '@/features/tenant/slice/tenantAuthSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { authInputClassName } from '@/lib/validation/authFieldStyles';
import {
  type TenantRegisterFormValues,
  tenantRegisterSchema,
} from '@/lib/validation/authSchemas';

export function TenantRegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error, postRegisterLoginHint } =
    useAppSelector((s) => s.tenantAuth);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TenantRegisterFormValues>({
    resolver: zodResolver(tenantRegisterSchema),
    defaultValues: {
      organizationName: '',
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (postRegisterLoginHint === null) {
      return;
    }
    const email = postRegisterLoginHint;
    dispatch(clearPostRegisterLoginHint());
    navigate('/tenant/login', {
      replace: true,
      state: { registeredEmail: email },
    });
  }, [postRegisterLoginHint, dispatch, navigate]);

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

  if (isAuthenticated) {
    return <Navigate replace to="/tenant/workspaces" />;
  }

  const onSubmit = ({
    organizationName,
    displayName,
    email,
    password,
  }: TenantRegisterFormValues) =>
    dispatch(
      tenantRegisterRequested({
        organizationName,
        displayName,
        email,
        password,
      }),
    );

  return (
    <div className="from-muted/35 relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-to-b via-background to-background px-4 py-3 sm:py-4">
      <div aria-hidden className="bg-primary/10 absolute -right-16 top-14 h-44 w-44 rounded-full blur-3xl" />
      <div className="border-primary/20 relative w-full max-w-xl overflow-hidden rounded-2xl border bg-card shadow-lg shadow-black/5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.1] via-primary/[0.02] to-transparent"
        />
        <AuthCardTopHome />
        <div className="relative z-10 px-4 pb-3 pt-4 text-center sm:px-8 sm:pb-3 sm:pt-5">
          <div className="mb-2 flex justify-center">
            <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border border-primary/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] sm:py-1 sm:text-[11px]">
              <Building2 size={13} strokeWidth={2} />
              Register organisation
            </div>
          </div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
            Register your organisation
          </h1>
          <p className="text-muted-foreground mx-auto mt-1 max-w-lg text-pretty text-xs leading-snug sm:text-sm">
            Admin account and organisation workspace — you will manage users and billing.
          </p>
        </div>
        <form
          className="relative z-10 mx-auto grid min-w-0 max-w-xl grid-cols-1 gap-x-3 gap-y-2 px-4 pb-3 sm:grid-cols-2 sm:gap-x-4 sm:px-8 sm:pb-4"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="min-w-0 space-y-1.5">
            <label className="text-foreground block text-start text-xs font-medium" htmlFor="tenant-reg-org">
              Organisation name
            </label>
            <input
              id="tenant-reg-org"
              autoComplete="organization"
              className={authInputClassName(!!errors.organizationName)}
              placeholder="e.g. Northwind Labs"
              type="text"
              aria-invalid={!!errors.organizationName}
              aria-describedby={
                errors.organizationName ? 'tenant-reg-org-err' : undefined
              }
              {...register('organizationName')}
            />
            {errors.organizationName ? (
              <p id="tenant-reg-org-err" className="text-destructive text-xs" role="alert">
                {errors.organizationName.message}
              </p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-1.5">
            <label
              className="text-foreground block text-start text-xs font-medium"
              htmlFor="tenant-reg-display-name"
            >
              Your name
            </label>
            <input
              id="tenant-reg-display-name"
              autoComplete="name"
              className={authInputClassName(!!errors.displayName)}
              placeholder="How we’ll greet you"
              type="text"
              aria-invalid={!!errors.displayName}
              aria-describedby={
                errors.displayName ? 'tenant-reg-display-name-err' : undefined
              }
              {...register('displayName')}
            />
            {errors.displayName ? (
              <p
                id="tenant-reg-display-name-err"
                className="text-destructive text-xs"
                role="alert"
              >
                {errors.displayName.message}
              </p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-1.5 sm:col-span-2">
            <label className="text-foreground block text-start text-xs font-medium" htmlFor="tenant-reg-email">
              Email
            </label>
            <input
              id="tenant-reg-email"
              autoComplete="email"
              className={authInputClassName(!!errors.email)}
              placeholder="you@team.com"
              type="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'tenant-reg-email-err' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p id="tenant-reg-email-err" className="text-destructive text-xs" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-1.5">
            <label className="text-foreground block text-start text-xs font-medium" htmlFor="tenant-reg-password">
              Password (8+ characters)
            </label>
            <div className="relative">
              <input
                id="tenant-reg-password"
                autoComplete="new-password"
                className={`${authInputClassName(!!errors.password)} pr-11`}
                placeholder="Choose a strong password"
                type={isPasswordVisible ? 'text' : 'password'}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'tenant-reg-password-err' : undefined
                }
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
              <p id="tenant-reg-password-err" className="text-destructive text-xs" role="alert">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-1.5">
            <label className="text-foreground block text-start text-xs font-medium" htmlFor="tenant-reg-confirm-password">
              Confirm password
            </label>
            <input
              id="tenant-reg-confirm-password"
              autoComplete="new-password"
              className={authInputClassName(!!errors.confirmPassword)}
              placeholder="Re-enter your password"
              type="password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? 'tenant-reg-confirm-password-err' : undefined
              }
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <p
                id="tenant-reg-confirm-password-err"
                className="text-destructive text-xs"
                role="alert"
              >
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-1.5 sm:col-span-2">
            <Button
              className="w-full"
              disabled={isSubmitting || isLoading}
              size="default"
              type="submit"
            >
              {isLoading ? 'Registering organisation...' : 'Register organisation'}
            </Button>
            {error ? (
              <p className="text-destructive text-xs" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </form>

        <TenantAuthPortalFooter variant="register" />
      </div>
    </div>
  );
}
