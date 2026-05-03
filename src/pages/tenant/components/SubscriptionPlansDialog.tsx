import { useState } from 'react';
import { CreditCard, LogOut, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { BillingPlan } from '@/lib/api/Api';
import { isSandboxCheckoutCardEnabled } from '@/pages/home/SandboxTestCreditCard';
import { SandboxTestPaymentSheet } from '@/pages/tenant/components/SandboxTestPaymentSheet';
import { SubscriptionPlanCard } from '@/pages/tenant/components/subscription/SubscriptionPlanCard';
import { SubscriptionPlanSkeletonGrid } from '@/pages/tenant/components/subscription/SubscriptionPlanSkeletonGrid';

interface SubscriptionPlansDialogProps {
  open: boolean;
  isChecking: boolean;
  plans: BillingPlan[];
  checkoutPlanId: string | null;
  currentStripePriceId: string | null;
  mode: 'subscribe' | 'upgrade';
  onOpenChange: (open: boolean) => void;
  onPlanSelect: (stripePriceId: string) => void;
  onClose: () => void;
  onLogout: () => void;
  isLogoutPending?: boolean;
}

export function SubscriptionPlansDialog({
  open,
  isChecking,
  plans,
  checkoutPlanId,
  currentStripePriceId,
  mode,
  onOpenChange,
  onPlanSelect,
  onClose,
  onLogout,
  isLogoutPending = false,
}: SubscriptionPlansDialogProps) {
  const isUpgradeFlow = mode === 'upgrade';
  const canDismiss = isUpgradeFlow;
  const showSandboxTestCard = isSandboxCheckoutCardEnabled();
  const [sandboxSheetOpen, setSandboxSheetOpen] = useState(false);

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && canDismiss) {
          onClose();
        }
        if (!nextOpen) {
          setSandboxSheetOpen(false);
        }
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-8"
        onEscapeKeyDown={canDismiss ? undefined : (event) => event.preventDefault()}
        onPointerDownOutside={canDismiss ? undefined : (event) => event.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader className="gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-2 text-left">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-primary size-5 shrink-0" aria-hidden />
              {isUpgradeFlow ? 'Upgrade your subscription' : 'Choose your subscription package'}
            </DialogTitle>
            <DialogDescription>
              {isUpgradeFlow
                ? 'Reuse the same billing flow to switch plans without leaving your workspace.'
                : 'Pick a plan to continue, including Free. This step cannot be skipped until a plan is selected.'}
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start">
            {showSandboxTestCard ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setSandboxSheetOpen(true)}
              >
                <CreditCard className="size-4" aria-hidden />
                Test card
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground size-9 shrink-0"
              disabled={isLogoutPending}
              aria-label={isLogoutPending ? 'Signing out…' : 'Log out'}
              onClick={onLogout}
            >
              <LogOut className="size-4" aria-hidden />
            </Button>
          </div>
        </DialogHeader>

        {isChecking ? (
          <SubscriptionPlanSkeletonGrid />
        ) : plans.length > 0 ? (
          <div className="mt-2 grid gap-4 lg:grid-cols-4">
            {plans.map((plan, index) => {
              const isFeatured = index === 1;
              const isCheckoutLoading = checkoutPlanId === plan.stripePriceId;

              return (
                <SubscriptionPlanCard
                  key={plan.id}
                  isCheckoutLoading={isCheckoutLoading}
                  isCurrentPlan={currentStripePriceId === plan.stripePriceId}
                  isFeatured={isFeatured}
                  onPlanSelect={onPlanSelect}
                  plan={plan}
                  mode={mode}
                />
              );
            })}
          </div>
        ) : (
          <div className="border-border bg-muted/40 mt-2 rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">
              No active plans are available right now. Contact support to continue.
            </p>
          </div>
        )}

        {isUpgradeFlow ? (
          <DialogFooter className="justify-center sm:justify-center">
            <Button onClick={onClose} type="button" variant="outline">
              Keep current plan
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>

    <SandboxTestPaymentSheet onOpenChange={setSandboxSheetOpen} open={sandboxSheetOpen} />
    </>
  );
}
