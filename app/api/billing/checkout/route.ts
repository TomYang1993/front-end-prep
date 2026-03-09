import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { badRequest, unauthorized } from '@/lib/api';
import { requireUser } from '@/lib/auth/current-user';
import { getBillingGateway } from '@/lib/billing/gateway-factory';
import { env } from '@/lib/env';

const checkoutSchema = z.object({
  mode: z.enum(['subscription', 'payment']),
  packId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireUser(req).catch(() => null);
  if (!user) {
    return unauthorized();
  }

  const parsed = checkoutSchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || 'Invalid checkout payload');
  }

  let priceId = env.proPlanPriceId;
  let packId: string | undefined;

  if (parsed.data.mode === 'payment') {
    if (!parsed.data.packId) {
      return badRequest('packId is required for one-time checkout');
    }

    const pack = await prisma.contentPack.findUnique({ where: { id: parsed.data.packId } });
    if (!pack || !pack.providerPriceId) {
      return badRequest('Invalid or unpriced content pack');
    }

    priceId = pack.providerPriceId;
    packId = pack.id;
  }

  if (!priceId) {
    return badRequest('Billing price is not configured');
  }

  const gateway = getBillingGateway();
  const session = await gateway.createCheckoutSession({
    userId: user.id,
    userEmail: user.email,
    mode: parsed.data.mode,
    priceId,
    packId,
    successUrl: `${env.appUrl}/billing/success`,
    cancelUrl: `${env.appUrl}/billing/cancel`,
  });

  return NextResponse.json({ checkoutUrl: session.url, sessionId: session.sessionId });
}
