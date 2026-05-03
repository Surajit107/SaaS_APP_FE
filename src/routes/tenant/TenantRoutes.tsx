import type { PropsWithChildren } from 'react';
import { Navigate, Route } from 'react-router-dom';

import { consumePostLogoutTenantLoginPath } from '@/lib/tenant/postLogoutTenantLogin';
import { tenantAuthenticatedHomePath } from '@/lib/tenant/tenantHomePath';
import { TenantLayout } from '@/pages/tenant/TenantLayout';
import { TenantLoginPage } from '@/pages/tenant/TenantLoginPage';
import { TenantRegisterPage } from '@/pages/tenant/TenantRegisterPage';
import { TenantUserDashboardPage } from '@/pages/tenant/TenantUserDashboardPage';
import { TenantUsersPage } from '@/pages/tenant/TenantUsersPage';
import { TenantUserLoginPage } from '@/pages/tenant/TenantUserLoginPage';
import { WorkspaceBoardPage } from '@/pages/tenant/WorkspaceBoardPage';
import { WorkspacesPage } from '@/pages/tenant/WorkspacesPage';
import { useAppSelector } from '@/store/hooks';

function TenantAuthPageGuard({ children }: PropsWithChildren) {
  const isTenantAuthenticated = useAppSelector(
    (state) => state.tenantAuth.isAuthenticated,
  );
  const tenantRole = useAppSelector((state) => state.tenantAuth.tenantRole);

  if (isTenantAuthenticated) {
    return <Navigate replace to={tenantAuthenticatedHomePath(tenantRole)} />;
  }
  return <>{children}</>;
}

function TenantProtectedRoute({ children }: PropsWithChildren) {
  const isAuthenticated = useAppSelector((state) => state.tenantAuth.isAuthenticated);
  if (!isAuthenticated) {
    const loginPath = consumePostLogoutTenantLoginPath() ?? '/tenant/login';
    return <Navigate replace to={loginPath} />;
  }
  return <>{children}</>;
}

function TenantHomeRedirect() {
  const tenantRole = useAppSelector((s) => s.tenantAuth.tenantRole);
  return <Navigate replace to={tenantAuthenticatedHomePath(tenantRole)} />;
}

export const tenantRoutes = (
  <>
    <Route
      element={
        <TenantAuthPageGuard>
          <TenantLoginPage />
        </TenantAuthPageGuard>
      }
      path="/tenant/login"
    />
    <Route
      element={
        <TenantAuthPageGuard>
          <TenantUserLoginPage />
        </TenantAuthPageGuard>
      }
      path="/tenant/user/login"
    />
    <Route
      element={
        <TenantAuthPageGuard>
          <TenantRegisterPage />
        </TenantAuthPageGuard>
      }
      path="/tenant/register"
    />
    <Route
      element={
        <TenantProtectedRoute>
          <TenantLayout />
        </TenantProtectedRoute>
      }
      path="/tenant"
    >
      <Route element={<TenantHomeRedirect />} index />
      <Route element={<WorkspacesPage />} path="workspaces" />
      <Route element={<WorkspaceBoardPage />} path="workspaces/:workspaceId" />
      <Route element={<TenantUsersPage />} path="users" />
      <Route element={<TenantUserDashboardPage />} path="user/dashboard" />
    </Route>
  </>
);
