import { BillingGateway } from '@/lib/billing/gateway';
import { stripeGateway } from '@/lib/billing/stripe-gateway';
import { lemonSqueezyGateway } from '@/lib/billing/lemonsqueezy-gateway';
import { env } from '@/lib/env';

/**
 * Returns the active billing gateway based on BILLING_PROVIDER env var.
 * Defaults to 'lemonsqueezy'. Set to 'stripe' to use Stripe instead.
 */
export function getBillingGateway(): BillingGateway {
    switch (env.billingProvider) {
        case 'stripe':
            return stripeGateway;
        case 'lemonsqueezy':
            return lemonSqueezyGateway;
        default:
            throw new Error(`Unknown billing provider: ${env.billingProvider}. Use 'stripe' or 'lemonsqueezy'.`);
    }
}
