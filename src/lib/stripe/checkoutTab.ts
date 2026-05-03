/**
 * Stripe Checkout opens in a new tab. `window.open(url)` after an async API call is often blocked;
 * opening `about:blank` synchronously from the same click handler keeps the tab usable.
 */

let pendingCheckoutTab: Window | null = null;

/** Call immediately when the user selects a plan (before dispatching checkout). */
export function openStripeCheckoutTabPlaceholder(): void {
  pendingCheckoutTab = window.open('about:blank', '_blank');
}

/** Close the placeholder tab if checkout failed before navigation (must not close after Stripe loaded). */
export function abortPendingCheckoutTab(): void {
  const tab = pendingCheckoutTab;
  pendingCheckoutTab = null;
  if (tab !== null && !tab.closed) {
    try {
      tab.close();
    } catch {
      // ignore
    }
  }
}

/** Navigate the tab opened by {@link openStripeCheckoutTabPlaceholder}, or fall back to same-window redirect. */
export function navigateStripeCheckoutInOpenedTab(url: string): void {
  const tab = pendingCheckoutTab;
  pendingCheckoutTab = null;

  if (tab !== null && !tab.closed) {
    try {
      tab.location.assign(url);
      return;
    } catch {
      try {
        tab.close();
      } catch {
        // ignore
      }
    }
  }

  const fallback = window.open(url, '_blank');
  if (fallback === null) {
    window.location.assign(url);
  }
}
