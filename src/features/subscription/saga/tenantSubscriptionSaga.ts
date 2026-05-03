import { createAction } from '@reduxjs/toolkit';
import { all, call, put, takeLatest } from 'redux-saga/effects';
import { toast } from 'sonner';

import {
  CANCEL_TENANT_SUBSCRIPTION,
  CONFIRM_CHECKOUT_SUCCESS,
  CREATE_CHECKOUT_SESSION,
  GET_BILLING_PLANS,
  GET_TENANT_SUBSCRIPTION,
  REQUEST_TENANT_SUBSCRIPTION_REFUND,
} from '@/lib/api/Api';
import { getApiErrorMessage } from '@/lib/api/errorMessage';
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/api/env';
import {
  abortPendingCheckoutTab,
  navigateStripeCheckoutInOpenedTab,
} from '@/lib/stripe/checkoutTab';
import { getStripeClient } from '@/lib/stripe/client';
import {
  cancelCompleted,
  cancelFailed,
  cancelRequested,
  checkoutCompleted,
  checkoutFailed,
  checkoutRequested,
  checkoutSyncFailed,
  checkoutSyncRequested,
  checkoutSyncSucceeded,
  promptCheckFailed,
  promptCheckRequested,
  promptCheckSucceeded,
  refundCompleted,
  refundFailed,
  refundRequested,
  subscriptionModalOpened,
  subscriptionSnapshotUpdated,
} from '@/features/subscription/slice/tenantSubscriptionSlice';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

export const tenantSubscriptionPromptRequested = createAction(
  'tenantSubscription/promptFlowRequested',
);

export const tenantSubscriptionCheckoutRequested = createAction<{
  stripePriceId: string;
}>('tenantSubscription/checkoutFlowRequested');

export const tenantSubscriptionCheckoutSyncRequested = createAction<{
  sessionId: string;
}>('tenantSubscription/checkoutSyncFlowRequested');

export const tenantSubscriptionModalOpenRequested = createAction(
  'tenantSubscription/modalOpenRequested',
);

export const tenantSubscriptionCancelRequested = createAction<{
  immediate?: boolean;
}>('tenantSubscription/cancelFlowRequested');

export const tenantSubscriptionRefundRequested = createAction<{
  note?: string;
}>('tenantSubscription/refundFlowRequested');

type CancelSubscriptionFlowAction = {
  payload: {
    immediate?: boolean;
  };
};

type RefundSubscriptionFlowAction = {
  payload: {
    note?: string;
  };
};

function* handleSubscriptionPromptCheck(): Generator {
  try {
    yield put(promptCheckRequested());

    const [plansResponse, subscriptionResponse] = (yield all([
      call(GET_BILLING_PLANS),
      call(GET_TENANT_SUBSCRIPTION),
    ])) as [
      Awaited<ReturnType<typeof GET_BILLING_PLANS>>,
      Awaited<ReturnType<typeof GET_TENANT_SUBSCRIPTION>>,
    ];

    const plans = plansResponse.data.data;
    const subscription = subscriptionResponse.data.data;
    const normalizedStatus = subscription.status.trim().toLowerCase();
    const hasActiveSubscription = ACTIVE_SUBSCRIPTION_STATUSES.has(normalizedStatus);

    yield put(
      promptCheckSucceeded({
        plans,
        subscription,
        openModal: !hasActiveSubscription,
      }),
    );
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to check subscription status');
    toast.error(message);
    yield put(promptCheckFailed(message));
  }
}

function* handleCheckoutRequested(
  action: ReturnType<typeof tenantSubscriptionCheckoutRequested>,
): Generator {
  try {
    yield put(checkoutRequested({ stripePriceId: action.payload.stripePriceId }));
    const response = (yield call(
      CREATE_CHECKOUT_SESSION,
      action.payload,
    )) as Awaited<ReturnType<typeof CREATE_CHECKOUT_SESSION>>;
    const { url } = response.data.data;

    if (STRIPE_PUBLISHABLE_KEY !== null) {
      const loadedStripe = (yield call(getStripeClient)) as Awaited<
        ReturnType<typeof getStripeClient>
      >;
      if (loadedStripe === null) {
        throw new Error('Stripe failed to initialize with the provided key');
      }
    }

    if (typeof url === 'string' && url.length > 0) {
      yield put(checkoutCompleted());
      navigateStripeCheckoutInOpenedTab(url);
      return;
    }

    throw new Error('Checkout session URL was not returned');
  } catch (error: unknown) {
    abortPendingCheckoutTab();
    const message = getApiErrorMessage(error, 'Unable to start checkout');
    toast.error(message);
    yield put(checkoutFailed(message));
  }
}

function* handleCheckoutSyncRequested(
  action: ReturnType<typeof tenantSubscriptionCheckoutSyncRequested>,
): Generator {
  try {
    const sessionId = action.payload.sessionId.trim();
    if (sessionId.length === 0) {
      throw new Error('Checkout session id is required');
    }
    yield put(checkoutSyncRequested({ sessionId }));
    const response = (yield call(CONFIRM_CHECKOUT_SUCCESS, {
      sessionId,
    })) as Awaited<ReturnType<typeof CONFIRM_CHECKOUT_SUCCESS>>;
    const data = response.data.data;
    const subscriptionResponse = (yield call(
      GET_TENANT_SUBSCRIPTION,
    )) as Awaited<ReturnType<typeof GET_TENANT_SUBSCRIPTION>>;
    const subscription = subscriptionResponse.data.data;
    yield put(
      checkoutSyncSucceeded({
        sessionId: data.sessionId,
        synced: data.synced,
        subscriptionStatus: data.subscriptionStatus,
        planKey: data.planKey,
      }),
    );
    yield put(subscriptionSnapshotUpdated(subscription));
  } catch (error: unknown) {
    const message = getApiErrorMessage(
      error,
      'Unable to sync checkout session status',
    );
    toast.error(message);
    yield put(checkoutSyncFailed(message));
  }
}

function* handleSubscriptionModalOpenRequested(): Generator {
  yield put(subscriptionModalOpened());
}

function* handleCancelRequested(
  action: CancelSubscriptionFlowAction,
): Generator {
  try {
    yield put(cancelRequested());
    yield call(CANCEL_TENANT_SUBSCRIPTION, {
      immediate: action.payload.immediate,
    });
    const subscriptionResponse = (yield call(
      GET_TENANT_SUBSCRIPTION,
    )) as Awaited<ReturnType<typeof GET_TENANT_SUBSCRIPTION>>;
    yield put(subscriptionSnapshotUpdated(subscriptionResponse.data.data));
    toast.success('Subscription cancellation updated');
    yield put(cancelCompleted());
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to cancel subscription');
    toast.error(message);
    yield put(cancelFailed(message));
  }
}

function* handleRefundRequested(
  action: RefundSubscriptionFlowAction,
): Generator {
  try {
    yield put(refundRequested());
    yield call(REQUEST_TENANT_SUBSCRIPTION_REFUND, { note: action.payload.note });
    toast.success('Refund request submitted');
    yield put(refundCompleted());
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to request refund');
    toast.error(message);
    yield put(refundFailed(message));
  }
}

export function* tenantSubscriptionSaga(): Generator {
  yield all([
    takeLatest(
      tenantSubscriptionPromptRequested.type,
      handleSubscriptionPromptCheck,
    ),
    takeLatest(
      tenantSubscriptionCheckoutRequested.type,
      handleCheckoutRequested,
    ),
    takeLatest(
      tenantSubscriptionCheckoutSyncRequested.type,
      handleCheckoutSyncRequested,
    ),
    takeLatest(
      tenantSubscriptionModalOpenRequested.type,
      handleSubscriptionModalOpenRequested,
    ),
    takeLatest(tenantSubscriptionCancelRequested, handleCancelRequested),
    takeLatest(tenantSubscriptionRefundRequested, handleRefundRequested),
  ]);
}
