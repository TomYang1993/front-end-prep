import { NextRequest, NextResponse } from 'next/server';
import { stripeGateway } from '@/lib/billing/stripe-gateway';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
  }

  const body = Buffer.from(await req.arrayBuffer());

  try {
    await stripeGateway.handleWebhook(body, signature);
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook failed' },
      { status: 400 }
    );
  }
}
