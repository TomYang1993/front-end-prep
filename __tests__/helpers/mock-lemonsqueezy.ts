import { vi } from 'vitest';
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface LSWebhookPayload {
  meta: { event_name: string; custom_data?: Record<string, unknown> };
  data: { id: string; type: string; attributes: Record<string, unknown> };
}

export function signLSPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyLSSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = signLSPayload(payload, secret);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function mockLSClient(opts: { checkoutUrl?: string } = {}) {
  return {
    createCheckout: vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 'co_123',
          attributes: {
            url: opts.checkoutUrl ?? 'https://checkout.lemonsqueezy.com/c/co_123'
          }
        }
      },
      error: null
    }),
    getSubscription: vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 'sub_123',
          attributes: { status: 'active' }
        }
      },
      error: null
    }),
    cancelSubscription: vi.fn().mockResolvedValue({
      data: { data: { id: 'sub_123', attributes: { status: 'cancelled' } } },
      error: null
    })
  };
}
