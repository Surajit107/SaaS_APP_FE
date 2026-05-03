import { loadStripe, type Stripe } from '@stripe/stripe-js';

import { STRIPE_PUBLISHABLE_KEY } from '@/lib/api/env';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeClient(): Promise<Stripe | null> {
  if (STRIPE_PUBLISHABLE_KEY === null) {
    return Promise.resolve(null);
  }
  if (stripePromise === null) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}
