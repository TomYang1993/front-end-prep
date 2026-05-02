import { vi } from 'vitest';

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

export function mockStripeClient(opts: {
  webhookEvent?: StripeWebhookEvent;
  signatureValid?: boolean;
} = {}) {
  const { webhookEvent, signatureValid = true } = opts;

  return {
    webhooks: {
      constructEvent: vi.fn().mockImplementation(() => {
        if (!signatureValid) throw new Error('Invalid signature');
        return webhookEvent;
      })
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/c/pay/cs_test_123'
        })
      }
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        id: 'sub_123',
        status: 'active',
        customer: 'cus_123'
      }),
      cancel: vi.fn().mockResolvedValue({ id: 'sub_123', status: 'canceled' })
    }
  };
}
