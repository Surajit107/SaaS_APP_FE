import { useCallback, useState } from 'react';
import { CreditCard, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  getSandboxTestPaymentClipboardText,
  isSandboxCheckoutCardEnabled,
  SandboxTestCreditCard,
} from '@/pages/home/SandboxTestCreditCard';

interface SandboxTestPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SandboxTestPaymentSheet({ open, onOpenChange }: SandboxTestPaymentSheetProps) {
  const [copyAllBusy, setCopyAllBusy] = useState(false);

  const handleCopyAll = useCallback(async () => {
    setCopyAllBusy(true);
    try {
      await navigator.clipboard.writeText(getSandboxTestPaymentClipboardText());
      toast.success('Test payment details copied');
    } catch {
      toast.error('Could not copy — select fields individually');
    } finally {
      setCopyAllBusy(false);
    }
  }, []);

  if (!isSandboxCheckoutCardEnabled()) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto" side="right">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 pr-8">
            <CreditCard className="text-primary size-5 shrink-0" aria-hidden />
            Sandbox test payment
          </SheetTitle>
          <SheetDescription>
            Use these values on the Stripe Checkout page (new tab). Test mode only — no real charges.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 px-4 pb-2">
          <SandboxTestCreditCard embedded variant="default" />
        </div>

        <SheetFooter className="border-border flex-row items-center justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            disabled={copyAllBusy}
            onClick={handleCopyAll}
          >
            <Copy className="size-4" aria-hidden />
            Copy all as text
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
