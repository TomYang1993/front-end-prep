import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/billing/stripe-gateway', () => ({
  stripeGateway: { __kind: 'stripe' }
}));
vi.mock('@/lib/billing/lemonsqueezy-gateway', () => ({
  lemonSqueezyGateway: { __kind: 'lemonsqueezy' }
}));

describe('getBillingGateway', () => {
  const originalProvider = process.env.BILLING_PROVIDER;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalProvider === undefined) delete process.env.BILLING_PROVIDER;
    else process.env.BILLING_PROVIDER = originalProvider;
  });

  it('returns stripe gateway when BILLING_PROVIDER=stripe', async () => {
    process.env.BILLING_PROVIDER = 'stripe';
    const { getBillingGateway } = await import('@/lib/billing/gateway-factory');
    expect((getBillingGateway() as { __kind: string }).__kind).toBe('stripe');
  });

  it('returns lemonsqueezy gateway when BILLING_PROVIDER=lemonsqueezy', async () => {
    process.env.BILLING_PROVIDER = 'lemonsqueezy';
    const { getBillingGateway } = await import('@/lib/billing/gateway-factory');
    expect((getBillingGateway() as { __kind: string }).__kind).toBe('lemonsqueezy');
  });

  it('defaults to lemonsqueezy when BILLING_PROVIDER unset', async () => {
    delete process.env.BILLING_PROVIDER;
    const { getBillingGateway } = await import('@/lib/billing/gateway-factory');
    expect((getBillingGateway() as { __kind: string }).__kind).toBe('lemonsqueezy');
  });

  it('throws on unknown provider value', async () => {
    process.env.BILLING_PROVIDER = 'paypal';
    const { getBillingGateway } = await import('@/lib/billing/gateway-factory');
    expect(() => getBillingGateway()).toThrow(/Unknown billing provider: paypal/);
  });
});
