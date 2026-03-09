import {
    lemonSqueezySetup,
    createCheckout,
    cancelSubscription as lsCancelSubscription,
} from '@lemonsqueezy/lemonsqueezy.js';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db/prisma';
import { getRequiredEnv } from '@/lib/env';
import { BillingGateway, CheckoutSessionInput } from '@/lib/billing/gateway';

function initLemonSqueezy() {
    lemonSqueezySetup({
        apiKey: getRequiredEnv('LEMONSQUEEZY_API_KEY'),
    });
}

export class LemonSqueezyGateway implements BillingGateway {
    async createCheckoutSession(input: CheckoutSessionInput): Promise<{ url: string; sessionId: string }> {
        initLemonSqueezy();
        const storeId = getRequiredEnv('LEMONSQUEEZY_STORE_ID');
        const variantId = input.priceId; // In Lemon Squeezy, variantId = priceId equivalent

        if (!variantId) {
            throw new Error('Missing Lemon Squeezy variant ID');
        }

        const { data, error } = await createCheckout(storeId, variantId, {
            checkoutData: {
                email: input.userEmail,
                custom: {
                    user_id: input.userId,
                    pack_id: input.packId || '',
                },
            },
            productOptions: {
                redirectUrl: input.successUrl,
            },
        });

        if (error || !data) {
            throw new Error(error?.message || 'Failed to create Lemon Squeezy checkout');
        }

        const checkoutUrl = data.data.attributes.url;
        const sessionId = data.data.id;

        return { url: checkoutUrl, sessionId };
    }

    async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
        const secret = getRequiredEnv('LEMONSQUEEZY_WEBHOOK_SECRET');

        // Verify webhook signature
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(rawBody);
        const computedSignature = hmac.digest('hex');

        if (computedSignature !== signature) {
            throw new Error('Invalid Lemon Squeezy webhook signature');
        }

        const payload = JSON.parse(rawBody.toString());
        const eventName: string = payload.meta?.event_name || '';
        const customData = payload.meta?.custom_data || {};
        const userId: string = customData.user_id || '';
        const packId: string = customData.pack_id || '';

        if (!userId) return;

        // Handle subscription events
        if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
            const attributes = payload.data?.attributes || {};
            const lsSubscriptionId = String(payload.data?.id || '');
            const lsCustomerId = String(attributes.customer_id || '');
            const variantId = String(attributes.variant_id || '');
            const status = attributes.status; // active, cancelled, expired, on_trial, paused, past_due, unpaid

            const plan = await prisma.subscriptionPlan.findFirst({
                where: { providerPriceId: variantId },
            });
            if (!plan) return;

            const normalizedStatus = status === 'active' || status === 'on_trial'
                ? 'ACTIVE'
                : status === 'cancelled'
                    ? 'CANCELED'
                    : status === 'past_due' || status === 'unpaid'
                        ? 'PAST_DUE'
                        : 'EXPIRED';

            const periodStart = attributes.renews_at
                ? new Date(attributes.created_at)
                : new Date();
            const periodEnd = attributes.renews_at
                ? new Date(attributes.renews_at)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const upserted = await prisma.subscription.upsert({
                where: { providerSubscriptionId: lsSubscriptionId },
                update: {
                    status: normalizedStatus,
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                    canceledAt: attributes.cancelled ? new Date() : null,
                },
                create: {
                    userId,
                    planId: plan.id,
                    providerCustomerId: lsCustomerId,
                    providerSubscriptionId: lsSubscriptionId,
                    status: normalizedStatus,
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                },
            });

            await prisma.entitlement.upsert({
                where: { source_sourceId: { source: 'SUBSCRIPTION', sourceId: upserted.id } },
                update: {
                    active: normalizedStatus === 'ACTIVE',
                    startsAt: periodStart,
                    endsAt: periodEnd,
                    planId: plan.id,
                },
                create: {
                    userId,
                    source: 'SUBSCRIPTION',
                    sourceId: upserted.id,
                    planId: plan.id,
                    startsAt: periodStart,
                    endsAt: periodEnd,
                    active: normalizedStatus === 'ACTIVE',
                },
            });
        }

        // Handle one-time payment events
        if (eventName === 'order_created' && packId) {
            const attributes = payload.data?.attributes || {};
            const orderId = String(payload.data?.id || '');
            const amountCents = attributes.total || 0;
            const currency = attributes.currency || 'usd';

            const pack = await prisma.contentPack.findUnique({ where: { id: packId } });
            if (!pack) return;

            const purchase = await prisma.packPurchase.upsert({
                where: { providerCheckoutSessionId: orderId },
                update: {
                    status: 'COMPLETED',
                },
                create: {
                    userId,
                    packId: pack.id,
                    providerCheckoutSessionId: orderId,
                    status: 'COMPLETED',
                    amountCents,
                    currency,
                },
            });

            await prisma.entitlement.upsert({
                where: { source_sourceId: { source: 'PACK', sourceId: purchase.id } },
                update: {
                    active: true,
                    packId: pack.id,
                    endsAt: null,
                },
                create: {
                    userId,
                    source: 'PACK',
                    sourceId: purchase.id,
                    packId: pack.id,
                    startsAt: new Date(),
                    endsAt: null,
                    active: true,
                },
            });
        }

        // Handle subscription cancellation
        if (eventName === 'subscription_cancelled') {
            const lsSubscriptionId = String(payload.data?.id || '');
            const dbSub = await prisma.subscription.findUnique({
                where: { providerSubscriptionId: lsSubscriptionId },
            });
            if (!dbSub) return;

            await prisma.subscription.update({
                where: { id: dbSub.id },
                data: {
                    status: 'CANCELED',
                    canceledAt: new Date(),
                },
            });

            await prisma.entitlement.updateMany({
                where: { source: 'SUBSCRIPTION', sourceId: dbSub.id },
                data: { active: false },
            });
        }
    }

    async cancelSubscription(subscriptionId: string): Promise<void> {
        initLemonSqueezy();
        const { error } = await lsCancelSubscription(subscriptionId);
        if (error) {
            throw new Error(error.message || 'Failed to cancel subscription');
        }
    }
}

export const lemonSqueezyGateway = new LemonSqueezyGateway();
