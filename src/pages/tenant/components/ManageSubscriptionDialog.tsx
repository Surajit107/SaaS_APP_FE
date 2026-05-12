import {
  AlertTriangle,
  CreditCard,
  Gem,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DetailCardSection } from '@/pages/tenant/components/DetailCardSection';

interface ManageSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planKey: string | null;
  /** When set (from GET /billing/plans/:id), shown as the plan chip label instead of formatting planKey. */
  catalogPlanName?: string | null;
  subscriptionStatus: string | null;
  nextBillingDate: string | null;
  nextBillingInDays: number | null;
  planFeatures: string[];
  isPlanDetailLoading?: boolean;
  planDetailError?: string | null;
  isCancelling: boolean;
  isRefunding: boolean;
  onUpgrade: () => void;
  onCancel: () => void;
  onRefund: () => void;
}

export function ManageSubscriptionDialog({
  open,
  onOpenChange,
  planKey,
  catalogPlanName = null,
  subscriptionStatus,
  nextBillingDate,
  nextBillingInDays,
  planFeatures,
  isPlanDetailLoading = false,
  planDetailError = null,
  isCancelling,
  isRefunding,
  onUpgrade,
  onCancel,
  onRefund,
}: ManageSubscriptionDialogProps) {
  const normalizedStatus = subscriptionStatus?.trim().toLowerCase() ?? 'inactive';
  const hasActiveSubscription =
    normalizedStatus === 'active' || normalizedStatus === 'trialing';
  const normalizedPlan = (planKey ?? '').trim().toLowerCase();

  const formatPlanLabel = (value: string | null): string => {
    if (!value) {
      return 'No active plan';
    }
    return value
      .replace(/[_-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const resolvePlanChipClasses = (plan: string): string => {
    if (plan.includes('enterprise')) {
      return 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300';
    }
    if (plan.includes('pro') || plan.includes('premium') || plan.includes('business')) {
      return 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300';
    }
    if (plan.includes('free')) {
      return 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300';
    }
    return 'border-primary/30 bg-primary/10 text-primary';
  };

  const formatStatusLabel = (status: string): string => {
    return status
      .replace(/[_-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const resolveStatusPresentation = (
    status: string,
  ): {
    icon: typeof ShieldCheck;
    classes: string;
  } => {
    if (status === 'active') {
      return {
        icon: ShieldCheck,
        classes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      };
    }
    if (status === 'trialing') {
      return {
        icon: Sparkles,
        classes: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
      };
    }
    if (status === 'past_due' || status === 'unpaid') {
      return {
        icon: AlertTriangle,
        classes: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
      };
    }
    if (status === 'canceled' || status === 'cancelled' || status === 'incomplete_expired') {
      return {
        icon: XCircle,
        classes: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
      };
    }
    return {
      icon: AlertTriangle,
      classes: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
    };
  };

  const planLabel = hasActiveSubscription
    ? catalogPlanName?.trim() || formatPlanLabel(planKey)
    : 'No active plan';
  const statusLabel = formatStatusLabel(normalizedStatus);
  const planChipClasses = resolvePlanChipClasses(normalizedPlan);
  const statusPresentation = resolveStatusPresentation(normalizedStatus);
  const StatusIcon = statusPresentation.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="text-primary size-5" aria-hidden />
            Manage subscription
          </DialogTitle>
          <DialogDescription>
            Review current billing status and manage upgrade, cancellation, and refund actions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <DetailCardSection title="Subscription">
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                  Current plan
                </dt>
                <dd className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${planChipClasses}`}
                  >
                    <Gem className="size-3.5" aria-hidden />
                    {planLabel}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                  Subscription status
                </dt>
                <dd className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${statusPresentation.classes}`}
                  >
                    <StatusIcon className="size-3.5" aria-hidden />
                    {statusLabel}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                  Next billing date
                </dt>
                <dd className="text-foreground mt-1">
                  {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                  Billing in
                </dt>
                <dd className="text-foreground mt-1">
                  {typeof nextBillingInDays === 'number'
                    ? `${nextBillingInDays} day${nextBillingInDays === 1 ? '' : 's'}`
                    : '—'}
                </dd>
              </div>
            </dl>
            <div className="mt-3">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Plan features</p>
              {isPlanDetailLoading ? (
                <p className="text-muted-foreground mt-2 text-sm">Loading latest plan details…</p>
              ) : null}
              {planDetailError ? (
                <p className="text-destructive mt-2 text-sm" role="alert">
                  {planDetailError}
                </p>
              ) : null}
              {planFeatures.length > 0 ? (
                <ul className="text-foreground mt-2 list-inside list-disc space-y-1 text-sm">
                  {planFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              ) : !isPlanDetailLoading ? (
                <p className="text-muted-foreground mt-2 text-sm">
                  No feature limits are configured for this plan.
                </p>
              ) : null}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Button onClick={onUpgrade} size="sm" type="button" variant="outline">
                {hasActiveSubscription ? 'Upgrade' : 'Choose plan'}
              </Button>
              <Button
                disabled={!hasActiveSubscription || isCancelling}
                onClick={onCancel}
                size="sm"
                type="button"
                variant="destructive"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel'}
              </Button>
              <Button
                disabled={!hasActiveSubscription || isRefunding}
                onClick={onRefund}
                size="sm"
                type="button"
                variant="secondary"
              >
                {isRefunding ? 'Submitting...' : 'Refund'}
              </Button>
            </div>
            {!hasActiveSubscription ? (
              <p className="text-muted-foreground mt-3 text-xs">
                Activate a plan first to use cancel and refund actions.
              </p>
            ) : null}
          </DetailCardSection>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
