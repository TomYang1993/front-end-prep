import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const perMinute = (limit: number, prefix: string) =>
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, '1 m'),
    prefix,
    analytics: true,
  });

/** Global catch-all: 200 req/min per IP */
export const globalLimiter = perMinute(200, 'rl:global');

/** Auth routes (OAuth, OTP): 10 req/min per IP */
export const authLimiter = perMinute(10, 'rl:auth');

/** API reads (non-logged-in): 60 req/min per IP */
export const anonReadLimiter = perMinute(60, 'rl:anon-read');

/** API reads (logged-in): 120 req/min per user */
export const userReadLimiter = perMinute(120, 'rl:user-read');

/** API mutations (logged-in): 30 req/min per user */
export const mutationLimiter = perMinute(30, 'rl:mutation');
