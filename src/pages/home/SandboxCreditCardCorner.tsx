import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  isSandboxCheckoutCardEnabled,
  SandboxTestCreditCard,
} from '@/pages/home/SandboxTestCreditCard';

/** Floating mini test card — opens full sandbox details in a dialog */
export function SandboxCreditCardCorner() {
  const [open, setOpen] = useState(false);

  if (!isSandboxCheckoutCardEnabled()) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(90dvh,40rem)] max-w-md gap-0 overflow-y-auto border p-0 sm:max-w-md">
          <DialogTitle className="sr-only">Sandbox test payment card</DialogTitle>
          <div className="p-4 sm:p-5">
            <SandboxTestCreditCard variant="default" embedded />
          </div>
        </DialogContent>
      </Dialog>

      <button
        type="button"
        className="sandbox-corner-bounce hover:[animation-play-state:paused] fixed z-40 flex h-[5rem] w-[8.25rem] cursor-pointer flex-col overflow-hidden rounded-xl border border-amber-300/30 bg-transparent text-left shadow-[0_0_20px_-8px_rgba(251,191,36,0.38)] outline-none ring-1 ring-amber-200/15 transition-[transform,box-shadow,border-color] hover:scale-[1.02] hover:border-amber-400/40 hover:shadow-[0_0_28px_-6px_rgba(251,191,36,0.48)] focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:ring-offset-2 sm:h-[5.25rem] sm:w-[8.5rem]"
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
          right: 'max(1rem, env(safe-area-inset-right, 0px))',
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open sandbox Stripe test card details"
        onClick={() => setOpen(true)}
      >
        <span className="relative flex h-full min-h-0 w-full flex-col justify-between overflow-hidden rounded-[inherit] bg-gradient-to-br from-amber-300 via-amber-500 to-amber-900 p-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] ring-1 ring-amber-100/12">
          <span
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_85%_-5%,rgba(255,255,255,0.2),transparent_55%)]"
            aria-hidden
          />
          <span className="pointer-events-none absolute -right-4 -top-4 size-16 rounded-full bg-yellow-200/32 blur-2xl" aria-hidden />
          <span className="pointer-events-none absolute -bottom-3 -left-3 size-20 rounded-full bg-amber-600/26 blur-2xl" aria-hidden />
          <span className="relative flex items-start justify-between gap-1">
            <span className="h-4 w-6 shrink-0 rounded bg-gradient-to-br from-amber-100 to-amber-500 shadow-sm ring-1 ring-white/30" />
            <span className="rounded border border-white/40 bg-white/15 px-1 py-px text-[0.45rem] font-bold uppercase tracking-wider text-white">
              Test
            </span>
          </span>
          <span className="relative font-mono text-[0.62rem] leading-tight tracking-[0.06em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
            4242 ··· 4242
          </span>
          <span className="relative text-[0.5rem] leading-tight text-white/90">Tap to copy test payment info</span>
        </span>
      </button>
    </>
  );
}
