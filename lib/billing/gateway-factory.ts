import { BillingGateway } from '@/lib/billing/gateway';
import { stripeGateway } from '@/lib/billing/stripe-gateway';
import { lemonSqueezyGateway } from '@/lib/billing/lemonsqueezy-gateway';

/**
 * Returns the active billing gateway based on BILLING_PROVIDER env var.
 * Defaults to 'lemonsqueezy'. Set to 'stripe' to use Stripe instead.
 */
export function getBillingGateway(): BillingGateway {
    const provider = process.env.BILLING_PROVIDER || 'lemonsqueezy';

    switch (provider) {
        case 'stripe':
            return stripeGateway;
        case 'lemonsqueezy':
            return lemonSqueezyGateway;
        default:
            throw new Error(`Unknown billing provider: ${provider}. Use 'stripe' or 'lemonsqueezy'.`);
    }
}
