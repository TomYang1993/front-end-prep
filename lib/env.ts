export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  proPlanPriceId: process.env.PRO_PLAN_PRICE_ID || process.env.STRIPE_PRO_PLAN_PRICE_ID || '',
  billingProvider: process.env.BILLING_PROVIDER || 'lemonsqueezy',
};

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
