import { Route } from 'react-router-dom';

import { AcceptInvitePage } from '@/pages/tenant/AcceptInvitePage';
import { VerifyEmailPage } from '@/pages/tenant/VerifyEmailPage';
import { BillingCancelPage } from '@/pages/billing/BillingCancelPage';
import { BillingSuccessPage } from '@/pages/billing/BillingSuccessPage';
import { HomePage } from '@/pages/HomePage';

export const publicRoutes = (
  <>
    <Route element={<HomePage />} path="/" />
    <Route element={<AcceptInvitePage />} path="/accept-invite" />
    <Route element={<VerifyEmailPage />} path="/verify-email" />
    <Route element={<BillingSuccessPage />} path="/billing/success" />
    <Route element={<BillingCancelPage />} path="/billing/cancel" />
  </>
);
