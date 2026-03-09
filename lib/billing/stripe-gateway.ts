import Stripe from 'stripe';
import { prisma } from '@/lib/db/prisma';
import { env, getRequiredEnv } from '@/lib/env';
import { BillingGateway, CheckoutSessionInput } from '@/lib/billing/gateway';

function getStripeClient() {
  return new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'));
}

export class StripeGateway implements BillingGateway {
  async createCheckoutSession(input: CheckoutSessionInput): Promise<{ url: string; sessionId: string }> {
    const stripe = getStripeClient();
    const mode = input.mode;

    if (!input.priceId) {
      throw new Error(`Missing Stripe price id for ${mode} checkout`);
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      customer_email: input.userEmail,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      line_items: [{
        price: input.priceId,
        quantity: 1,
      }],
      metadata: {
        userId: input.userId,
        packId: input.packId || '',
      },
    });

    return {
      url: session.url || `${env.appUrl}/billing/return`,
      sessionId: session.id,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const stripe = getStripeClient();
    const webhookSecret = getRequiredEnv('STRIPE_WEBHOOK_SECRET');
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (!userId) return;

      if (session.mode === 'subscription' && session.subscription) {
        const providerSubscriptionId = String(session.subscription);
        const subscription = await stripe.subscriptions.retrieve(providerSubscriptionId);
        const providerPriceId = subscription.items.data[0]?.price.id;
        if (!providerPriceId) return;

        const plan = await prisma.subscriptionPlan.findUnique({ where: { providerPriceId } });
        if (!plan) return;

        const upserted = await prisma.subscription.upsert({
          where: { providerSubscriptionId },
          update: {
            status: 'ACTIVE',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
          create: {
            userId,
            planId: plan.id,
            providerCustomerId: String(subscription.customer),
            providerSubscriptionId,
            status: 'ACTIVE',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });

        await prisma.entitlement.upsert({
          where: { source_sourceId: { source: 'SUBSCRIPTION', sourceId: upserted.id } },
          update: {
            active: true,
            startsAt: new Date(subscription.current_period_start * 1000),
            endsAt: new Date(subscription.current_period_end * 1000),
            planId: plan.id,
          },
          create: {
            userId,
            source: 'SUBSCRIPTION',
            sourceId: upserted.id,
            planId: plan.id,
            startsAt: new Date(subscription.current_period_start * 1000),
            endsAt: new Date(subscription.current_period_end * 1000),
            active: true,
          },
        });
      }

      if (session.mode === 'payment' && session.metadata?.packId) {
        const pack = await prisma.contentPack.findUnique({ where: { id: session.metadata.packId } });
        if (!pack) return;

        const purchase = await prisma.packPurchase.upsert({
          where: { providerCheckoutSessionId: session.id },
          update: {
            status: 'COMPLETED',
          },
          create: {
            userId,
            packId: pack.id,
            providerCheckoutSessionId: session.id,
            status: 'COMPLETED',
            amountCents: session.amount_total || 0,
            currency: session.currency || 'usd',
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
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const payload = event.data.object as Stripe.Subscription;
      const dbSub = await prisma.subscription.findUnique({
        where: { providerSubscriptionId: payload.id },
      });
      if (!dbSub) return;

      const nextStatus = payload.cancel_at_period_end ? 'CANCELED' : payload.status === 'active' ? 'ACTIVE' : 'EXPIRED';

      await prisma.subscription.update({
        where: { id: dbSub.id },
        data: {
          status: nextStatus,
          currentPeriodStart: new Date(payload.current_period_start * 1000),
          currentPeriodEnd: new Date(payload.current_period_end * 1000),
          canceledAt: payload.canceled_at ? new Date(payload.canceled_at * 1000) : null,
        },
      });

      await prisma.entitlement.updateMany({
        where: { source: 'SUBSCRIPTION', sourceId: dbSub.id },
        data: {
          active: nextStatus === 'ACTIVE',
          endsAt: new Date(payload.current_period_end * 1000),
        },
      });
    }

    if (event.type.startsWith('invoice.')) {
      const invoice = event.data.object as Stripe.Invoice;
      const providerSubscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
      if (!providerSubscriptionId) return;

      const subscription = await prisma.subscription.findUnique({ where: { providerSubscriptionId } });
      if (!subscription) return;

      await prisma.invoiceEvent.upsert({
        where: { providerEventId: event.id },
        update: {
          eventType: event.type,
          payload: event.data.object as object,
        },
        create: {
          subscriptionId: subscription.id,
          providerEventId: event.id,
          eventType: event.type,
          payload: event.data.object as object,
        },
      });
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const stripe = getStripeClient();
    await stripe.subscriptions.cancel(subscriptionId);
  }
}

export const stripeGateway = new StripeGateway();
