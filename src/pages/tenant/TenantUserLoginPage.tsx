import { UserCircle2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';

import { AuthCardTopHome } from '@/components/auth/AuthCardTopHome';
import { tenantAuthenticatedHomePath } from '@/lib/tenant/tenantHomePath';
import { TenantAuthPortalFooter } from '@/pages/tenant/components/TenantAuthPortalFooter';
import { TenantCredentialsLoginSection } from '@/pages/tenant/components/TenantCredentialsLoginSection';
import { useAppSelector } from '@/store/hooks';

type TenantUserLoginLocationState = { registeredEmail?: string };

export function TenantUserLoginPage() {
  const location = useLocation();
  const { isAuthenticated, tenantRole } = useAppSelector((s) => s.tenantAuth);

  const registeredEmailRaw = (location.state as TenantUserLoginLocationState | null)
    ?.registeredEmail;
  const initialEmail =
    typeof registeredEmailRaw === 'string' ? registeredEmailRaw : '';

  if (isAuthenticated) {
    return <Navigate replace to={tenantAuthenticatedHomePath(tenantRole)} />;
  }

  return (
    <div className="from-muted/35 relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-to-b via-background to-background px-4 py-3 sm:py-4">
      <div aria-hidden className="bg-primary/10 absolute -left-14 top-20 h-40 w-40 rounded-full blur-3xl" />
      <div className="border-primary/20 relative w-full max-w-xl overflow-hidden rounded-2xl border bg-card shadow-lg shadow-black/5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.1] via-primary/[0.02] to-transparent"
        />
        <AuthCardTopHome />
        <div className="relative z-10 px-4 pb-1 pt-4 text-center sm:px-8 sm:pb-2 sm:pt-5">
          <div className="bg-primary/10 text-primary mx-auto mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] sm:mb-3 sm:py-1 sm:text-[11px]">
            <UserCircle2 size={14} strokeWidth={2} />
            Team member
          </div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
            Sign in to your workspace
          </h1>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-xs leading-snug sm:text-sm">
            Use the email and password from your invitation.
          </p>
        </div>

        <TenantCredentialsLoginSection
          idPrefix="tenant-user"
          initialEmail={initialEmail}
          loginTenantRole="member"
        />

        <TenantAuthPortalFooter variant="member-login" />
      </div>
    </div>
  );
}
