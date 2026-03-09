'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useToast } from '@/components/toast-provider';

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
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title className="dialog-title">Unlock Premium Content</Dialog.Title>
          <Dialog.Description className="dialog-description">
            Get access to this question and all premium content.
          </Dialog.Description>

          <div className="stack-gap">
            <button
              className="btn"
              type="button"
              disabled={busy !== null}
              onClick={() => startCheckout('subscription')}
              style={{ width: '100%' }}
            >
              {busy === 'subscription' ? 'Starting checkout…' : 'Subscribe to Pro — $29/mo'}
            </button>

            {packId && (
              <button
                className="btn btn-secondary"
                type="button"
                disabled={busy !== null}
                onClick={() => startCheckout('payment')}
                style={{ width: '100%' }}
              >
                {busy === 'payment' ? 'Starting checkout…' : 'Buy this pack — one-time'}
              </button>
            )}
          </div>

          <Dialog.Close asChild>
            <button className="btn-ghost dialog-close" type="button" aria-label="Close">
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
