import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import {
  tenantProfileSyncRequested,
  tenantSessionSyncRequested,
} from '@/features/tenant/saga/tenantAuthSaga';
import { modalDismissed } from '@/features/subscription/slice/tenantSubscriptionSlice';
import {
  tenantSubscriptionCancelRequested,
  tenantSubscriptionCheckoutRequested,
  tenantSubscriptionModalOpenRequested,
  tenantSubscriptionRefundRequested,
} from '@/features/subscription/saga/tenantSubscriptionSaga';
import {
  clearTenantUpdateError,
  logoutRequested,
} from '@/features/tenant/slice/tenantAuthSlice';
import { openStripeCheckoutTabPlaceholder } from '@/lib/stripe/checkoutTab';
import {
  ManageSubscriptionDialog,
  SubscriptionPlansDialog,
  TenantDetailsDialog,
  type TenantDetailsDialogScope,
  TenantOrganizationEditDialog,
  TenantNotificationBell,
  TenantSidebar,
} from '@/pages/tenant/components';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

type TenantSubscriptionConfirmIntent = 'cancelSubscription' | 'requestRefund';

export function TenantLayout() {
  const dispatch = useAppDispatch();
  const [subscriptionConfirmIntent, setSubscriptionConfirmIntent] =
    useState<TenantSubscriptionConfirmIntent | null>(null);
  const subscriptionConfirmIntentRef = useRef<TenantSubscriptionConfirmIntent | null>(
    null,
  );
  subscriptionConfirmIntentRef.current = subscriptionConfirmIntent;
  const [isTenantDetailsOpen, setIsTenantDetailsOpen] = useState(false);
  const [tenantDetailsScope, setTenantDetailsScope] =
    useState<TenantDetailsDialogScope>('full');
  const [isTenantOrgEditOpen, setIsTenantOrgEditOpen] = useState(false);
  const [isManageSubscriptionOpen, setIsManageSubscriptionOpen] = useState(false);
  const {
    displayName,
    email,
    organizationName,
    tenantRole,
    tenantProfile,
    isTenantProfileLoading,
    isTenantUpdateLoading,
    tenantUpdateError,
    isLogoutPending,
  } = useAppSelector((s) => s.tenantAuth);
  const {
    isModalOpen,
    plans,
    checkoutPlanId,
    isChecking,
    checkoutSync,
    subscription,
    isCancelling,
    isRefunding,
  } = useAppSelector((s) => s.tenantSubscription);

  useEffect(() => {
    dispatch(tenantSessionSyncRequested());
    dispatch(tenantProfileSyncRequested());
  }, [dispatch]);

  useEffect(() => {
    if (isTenantDetailsOpen || isTenantOrgEditOpen) {
      dispatch(tenantProfileSyncRequested());
    }
  }, [dispatch, isTenantDetailsOpen, isTenantOrgEditOpen]);

  const closeSubscriptionModal = () => {
    dispatch(modalDismissed());
  };

  const handlePlanSelect = (stripePriceId: string): void => {
    openStripeCheckoutTabPlaceholder();
    dispatch(tenantSubscriptionCheckoutRequested({ stripePriceId }));
  };

  const handleOpenSubscriptionModal = (): void => {
    dispatch(tenantSubscriptionModalOpenRequested());
  };

  const handleOpenManageSubscription = (): void => {
    setIsManageSubscriptionOpen(true);
  };

  const handleCancelSubscription = (): void => {
    setSubscriptionConfirmIntent('cancelSubscription');
  };

  const handleRequestRefund = (): void => {
    setSubscriptionConfirmIntent('requestRefund');
  };

  const handleSubscriptionConfirm = (): void => {
    const intent = subscriptionConfirmIntentRef.current;
    if (intent === 'cancelSubscription') {
      dispatch(tenantSubscriptionCancelRequested({ immediate: false }));
      return;
    }
    if (intent === 'requestRefund') {
      dispatch(tenantSubscriptionRefundRequested({}));
    }
  };

  return (
    <>
      {/* Portal-based dialogs — rendered outside layout flow */}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setSubscriptionConfirmIntent(null);
          }
        }}
        open={subscriptionConfirmIntent !== null}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {subscriptionConfirmIntent === 'requestRefund'
                ? 'Request refund?'
                : 'Cancel subscription?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {subscriptionConfirmIntent === 'requestRefund'
                ? 'This sends a refund request for the latest paid invoice charge associated with your subscription.'
                : 'This schedules cancellation at period end. Access remains until the current billing cycle expires.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {subscriptionConfirmIntent === 'requestRefund'
                ? 'Not now'
                : 'Keep subscription'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubscriptionConfirm}
              variant={
                subscriptionConfirmIntent === 'cancelSubscription'
                  ? 'destructive'
                  : 'default'
              }
            >
              {subscriptionConfirmIntent === 'requestRefund'
                ? 'Request refund'
                : 'Cancel subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <TenantDetailsDialog
        email={email}
        isTenantProfileLoading={isTenantProfileLoading}
        onEditOrganization={
          tenantDetailsScope === 'full'
            ? () => {
                dispatch(clearTenantUpdateError());
                setIsTenantOrgEditOpen(true);
              }
            : undefined
        }
        onOpenChange={setIsTenantDetailsOpen}
        open={isTenantDetailsOpen}
        organizationDisplayName={tenantProfile?.name ?? organizationName ?? null}
        organizationIsActive={tenantProfile?.isActive ?? null}
        scope={tenantDetailsScope}
        tenantId={tenantProfile?.id ?? null}
      />
      <TenantOrganizationEditDialog
        isTenantProfileLoading={isTenantProfileLoading}
        isTenantUpdateLoading={isTenantUpdateLoading}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            dispatch(clearTenantUpdateError());
          }
          setIsTenantOrgEditOpen(nextOpen);
        }}
        open={isTenantOrgEditOpen}
        organizationNameFallback={organizationName}
        tenantProfile={tenantProfile}
        tenantUpdateError={tenantUpdateError}
      />
      <ManageSubscriptionDialog
        isCancelling={isCancelling}
        isRefunding={isRefunding}
        onCancel={handleCancelSubscription}
        onOpenChange={setIsManageSubscriptionOpen}
        onRefund={handleRequestRefund}
        onUpgrade={() => {
          setIsManageSubscriptionOpen(false);
          handleOpenSubscriptionModal();
        }}
        open={isManageSubscriptionOpen}
        planKey={subscription?.planKey ?? checkoutSync.planKey}
        nextBillingDate={
          subscription?.nextBillingDate ?? subscription?.currentPeriodEnd ?? null
        }
        nextBillingInDays={subscription?.nextBillingInDays ?? null}
        planFeatures={subscription?.plan?.featureHighlights ?? []}
        subscriptionStatus={subscription?.status ?? checkoutSync.subscriptionStatus}
      />
      <SubscriptionPlansDialog
        checkoutPlanId={checkoutPlanId}
        currentStripePriceId={subscription?.stripePriceId ?? null}
        isChecking={isChecking}
        isLogoutPending={isLogoutPending}
        mode={subscription?.status === 'active' || subscription?.status === 'trialing' ? 'upgrade' : 'subscribe'}
        onClose={closeSubscriptionModal}
        onLogout={() => dispatch(logoutRequested())}
        onOpenChange={() => {
          // Explicit open requests are controlled by Redux state.
        }}
        onPlanSelect={handlePlanSelect}
        open={isModalOpen}
        plans={plans}
      />

      {/* Sidebar layout */}
      <SidebarProvider>
        <TenantSidebar
          displayName={displayName}
          email={email}
          isLogoutPending={isLogoutPending}
          isTenantProfileLoading={isTenantProfileLoading}
          organizationName={tenantProfile?.name ?? organizationName ?? null}
          tenantRole={tenantRole}
          onLogout={() => dispatch(logoutRequested())}
          onManageSubscription={handleOpenManageSubscription}
          onOpenProfile={(scope) => {
            setTenantDetailsScope(scope);
            setIsTenantDetailsOpen(true);
          }}
        />
        <SidebarInset>
          <header className="border-border/60 bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-md sm:px-4">
            <SidebarTrigger className="-ml-0.5 shrink-0 sm:-ml-1" />
            <div aria-hidden className="bg-border mx-0.5 h-4 w-px shrink-0 sm:mx-1" />
            <span className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold">
              {tenantProfile?.name ?? organizationName ?? 'Your workspace'}
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <TenantNotificationBell />
            </div>
          </header>
          <main className="flex flex-1 flex-col px-3 py-6 sm:px-6 sm:py-8 md:px-8">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
