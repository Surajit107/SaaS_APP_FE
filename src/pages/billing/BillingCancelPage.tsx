import { useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { tenantSubscriptionCheckoutSyncRequested } from '@/features/subscription/saga/tenantSubscriptionSaga';
import { checkoutSyncCleared } from '@/features/subscription/slice/tenantSubscriptionSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function BillingCancelPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { isLoading, error } = useAppSelector((s) => s.tenantSubscription.checkoutSync);

  useEffect(() => {
    if (typeof sessionId === 'string' && sessionId.trim().length > 0) {
      dispatch(tenantSubscriptionCheckoutSyncRequested({ sessionId }));
    }
    return () => {
      dispatch(checkoutSyncCleared());
    };
  }, [dispatch, sessionId]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-b from-rose-50/70 via-background to-background px-4 py-10">
      <section className="border-border w-full max-w-xl overflow-hidden rounded-2xl border bg-card shadow-xl shadow-black/5">
        <div className="px-6 pb-3 pt-8 text-center sm:px-8">
          <span className="mx-auto mb-3 flex size-20 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/12">
            <AlertTriangle className="size-11 text-rose-600" aria-hidden />
          </span>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Checkout not completed
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
            You cancelled or closed checkout before payment completed. No charge
            was made. You can return and choose a subscription plan again.
          </p>
          {!isLoading && error ? (
            <p className="mt-2 text-xs text-rose-700">{error}</p>
          ) : null}
        </div>

        <div className="space-y-2 px-6 pb-8 pt-4 sm:px-8">
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={() => navigate('/tenant/workspaces')}
            size="lg"
            type="button"
            variant="destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Syncing checkout...
              </>
            ) : (
              'Back to workspace'
            )}
          </Button>
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={() => navigate('/')}
            size="lg"
            type="button"
            variant="outline"
          >
            Back to home
          </Button>
        </div>
      </section>
    </main>
  );
}
