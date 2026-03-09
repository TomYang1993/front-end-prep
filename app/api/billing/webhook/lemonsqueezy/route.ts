import { NextRequest, NextResponse } from 'next/server';
import { getBillingGateway } from '@/lib/billing/gateway-factory';

export async function POST(req: NextRequest) {
    const provider = process.env.BILLING_PROVIDER || 'lemonsqueezy';

    if (provider !== 'lemonsqueezy') {
        return NextResponse.json({ error: 'This endpoint is for Lemon Squeezy webhooks' }, { status: 400 });
    }

    const signature = req.headers.get('x-signature') || '';
    const rawBody = Buffer.from(await req.arrayBuffer());

    try {
        const gateway = getBillingGateway();
        await gateway.handleWebhook(rawBody, signature);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Lemon Squeezy webhook error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Webhook handling failed' },
            { status: 400 }
        );
    }
}
