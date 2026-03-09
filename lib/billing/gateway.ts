export interface CheckoutSessionInput {
  userId: string;
  userEmail: string;
  mode: 'subscription' | 'payment';
  priceId?: string;
  packId?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface BillingGateway {
  createCheckoutSession(input: CheckoutSessionInput): Promise<{ url: string; sessionId: string }>;
  handleWebhook(rawBody: Buffer, signature: string): Promise<void>;
  cancelSubscription(subscriptionId: string): Promise<void>;
}
