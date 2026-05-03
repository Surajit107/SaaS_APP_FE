import { useCallback, useId, useState } from 'react';
import { Check, Copy, CreditCard } from 'lucide-react';

import { STRIPE_PUBLISHABLE_KEY } from '@/lib/api/env';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/** Stripe test-mode universal success card (https://docs.stripe.com/testing) */
const TEST_CARD_NUMBER = '4242424242424242';
const TEST_CARD_DISPLAY = '4242 4242 4242 4242';
const TEST_EXPIRY_DISPLAY = '12 / 34';
const TEST_EXPIRY_STRIPE = '1234';
const TEST_CVC = '123';
const TEST_POSTAL = '10001';

/** Exported so the home layout can omit the sidebar column when this is false */
export function isSandboxCheckoutCardEnabled(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  return STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') ?? false;
}

/** Single clipboard blob for support / quick paste alongside field copies */
export function getSandboxTestPaymentClipboardText(): string {
  return [
    `Card number: ${TEST_CARD_NUMBER}`,
    `Expiry (MMYY): ${TEST_EXPIRY_STRIPE} — display ${TEST_EXPIRY_DISPLAY}`,
    `CVC: ${TEST_CVC}`,
    `Postal (US): ${TEST_POSTAL}`,
  ].join('\n');
}

function CopyField({
  label,
  value,
  displayValue,
  mono,
  compact,
  className,
}: {
  label: string;
  value: string;
  /** Shown in UI when different from clipboard value */
  displayValue?: string;
  mono?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const shown = displayValue ?? value;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }, [value]);

  return (
    <div
      className={cn(
        'flex min-w-0 items-center justify-between gap-1.5 rounded-lg bg-muted/50',
        compact ? 'px-2 py-1' : 'px-2.5 py-1.5',
        className,
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            'text-muted-foreground font-medium uppercase tracking-wide',
            compact ? 'text-[0.55rem] leading-tight' : 'text-[0.65rem]',
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            'text-foreground truncate font-medium',
            compact ? 'text-[0.7rem] leading-tight' : 'text-sm',
            mono && 'font-mono tabular-nums tracking-tight',
          )}
        >
          {shown}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'text-muted-foreground hover:text-foreground shrink-0',
          compact ? 'size-7' : 'size-8',
        )}
        onClick={handleCopy}
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
      >
        {copied ? (
          <Check className={cn('text-emerald-600', compact ? 'size-3.5' : 'size-4')} aria-hidden />
        ) : (
          <Copy className={compact ? 'size-3.5' : 'size-4'} aria-hidden />
        )}
      </Button>
    </div>
  );
}

export interface SandboxTestCreditCardProps {
  /** Narrow sidebar layout for landing — fits viewport without stacking below cards */
  variant?: 'default' | 'compact';
  /** Strip outer card chrome when rendered inside a dialog */
  embedded?: boolean;
}

export function SandboxTestCreditCard({
  variant = 'default',
  embedded = false,
}: SandboxTestCreditCardProps) {
  const headingId = useId();
  const compact = variant === 'compact';

  if (!isSandboxCheckoutCardEnabled()) {
    return null;
  }

  const body = (
    <>
      <div className={cn('flex items-start gap-2', compact ? 'mb-2' : 'mb-3')}>
        <div
          className={cn(
            'bg-primary/12 text-primary inline-flex shrink-0 items-center justify-center rounded-lg',
            compact ? 'size-7' : 'mt-0.5 size-8',
          )}
        >
          <CreditCard className={compact ? 'size-3.5' : 'size-4'} aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 id={headingId} className={cn('text-foreground font-semibold tracking-tight', compact ? 'text-xs' : 'text-sm')}>
            Sandbox checkout
          </h2>
          <p
            className={cn(
              'text-muted-foreground leading-snug',
              compact ? 'mt-0.5 line-clamp-2 text-[0.65rem]' : 'mt-0.5 text-xs',
            )}
          >
            {compact
              ? 'Stripe test mode — paste at subscribe checkout.'
              : 'Use these details in Stripe test mode when you subscribe — no real charges.'}
          </p>
        </div>
      </div>

      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-900 text-white',
          'shadow-[0_0_24px_-10px_rgba(251,191,36,0.4),inset_0_1px_0_rgba(255,255,255,0.18)]',
          'ring-1 ring-amber-100/15',
          compact ? 'p-2.5' : 'p-4 sm:p-5',
        )}
        role="img"
        aria-label={`Test Visa ending in 4242, expiry ${TEST_EXPIRY_DISPLAY}, CVC ${TEST_CVC}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_80%_-10%,rgba(255,255,255,0.22),transparent_55%)]" aria-hidden />
        <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-yellow-200/35 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 -left-10 size-48 rounded-full bg-amber-600/28 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 left-1/2 size-56 -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" aria-hidden />

        <div className="relative flex items-start justify-between gap-2">
          <div
            className={cn(
              'rounded bg-gradient-to-br from-amber-100 to-amber-500 shadow-md ring-1 ring-white/30',
              compact ? 'h-6 w-9' : 'h-9 w-12',
            )}
          />
          <span
            className={cn(
              'rounded border border-white/40 bg-white/15 font-semibold uppercase tracking-widest text-white',
              compact ? 'px-1.5 py-px text-[0.5rem]' : 'px-2 py-0.5 text-[0.6rem]',
            )}
          >
            Test
          </span>
        </div>

        <p
          className={cn(
            'relative font-mono tracking-[0.1em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]',
            compact ? 'mt-3 text-xs sm:text-sm' : 'mt-6 text-lg tracking-[0.12em] sm:text-xl',
          )}
        >
          {TEST_CARD_DISPLAY}
        </p>

        <div className={cn('relative flex items-end justify-between gap-2 text-white', compact ? 'mt-2 text-[0.65rem]' : 'mt-4 text-xs')}>
          <div>
            <p className="font-medium uppercase tracking-wider text-white/85">Cardholder</p>
            <p className="mt-px font-medium tracking-wide text-white">Sandbox User</p>
          </div>
          <div className="text-right">
            <p className="font-medium uppercase tracking-wider text-white/85">Expires</p>
            <p className="font-mono mt-px tabular-nums text-white">{TEST_EXPIRY_DISPLAY}</p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'grid gap-1.5',
          compact ? 'mt-2 grid-cols-2' : 'mt-3 gap-2 sm:grid-cols-2',
        )}
      >
        <CopyField label="Card number" value={TEST_CARD_NUMBER} mono compact={compact} className={compact ? 'col-span-2' : 'sm:col-span-2'} />
        <CopyField
          label="Expiry"
          value={TEST_EXPIRY_STRIPE}
          displayValue={TEST_EXPIRY_DISPLAY}
          mono
          compact={compact}
        />
        <CopyField label="CVC" value={TEST_CVC} mono compact={compact} />
        <CopyField label="Postal (US)" value={TEST_POSTAL} mono compact={compact} className={compact ? 'col-span-2' : 'sm:col-span-2'} />
      </div>
    </>
  );

  if (embedded) {
    return <div className="w-full">{body}</div>;
  }

  return (
    <section
      className={cn(
        'home-reveal-up border-border/80 bg-card/60 w-full rounded-2xl border shadow-sm backdrop-blur-sm',
        compact ? 'max-w-none p-3' : 'max-w-md p-4 sm:p-5',
      )}
      style={{ animationDelay: '380ms' }}
      aria-labelledby={headingId}
    >
      {body}
    </section>
  );
}
