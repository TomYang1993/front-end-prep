'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useToast } from '@/components/toast-provider';

import { X } from 'lucide-react';

interface PremiumUpsellProps {
  packId: string | null;
}

export function PremiumUpsell({ packId }: PremiumUpsellProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'subscription' | 'payment' | null>(null);

  async function startCheckout(mode: 'subscription' | 'payment') {
    setBusy(mode);

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          packId: mode === 'payment' ? packId : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      toast({
        title: 'Checkout failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        type: 'error',
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="btn" type="button">
          Unlock Premium
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-overlay backdrop-blur-[2px] z-40 transition-opacity duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-line rounded-lg shadow-lg p-6 w-[90vw] max-w-[450px] z-50 flex flex-col focus:outline-none">
          <Dialog.Title className="text-xl font-bold m-0 mb-2">Unlock Premium Content</Dialog.Title>
          <Dialog.Description className="text-muted text-[0.9rem] leading-relaxed mb-6">
            Get access to this question and all premium content.
          </Dialog.Description>

          <div className="flex flex-col gap-4">
            <button
              className="btn w-full"
              type="button"
              disabled={busy !== null}
              onClick={() => startCheckout('subscription')}
            >
              {busy === 'subscription' ? 'Starting checkout…' : 'Subscribe to Pro — $29/mo'}
            </button>

            {packId && (
              <button
                className="btn btn-secondary w-full"
                type="button"
                disabled={busy !== null}
                onClick={() => startCheckout('payment')}
              >
                {busy === 'payment' ? 'Starting checkout…' : 'Buy this pack — one-time'}
              </button>
            )}
          </div>

          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-muted hover:text-ink transition-colors shrink-0 p-0" type="button" aria-label="Close">
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
