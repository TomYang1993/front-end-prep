import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** Global catch-all: 200 req/min per IP */
export const globalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '1 m'),
  prefix: 'rl:global',
  analytics: true,
});

/** Auth routes (OAuth, OTP): 10 req/min per IP */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'rl:auth',
  analytics: true,
});

/** API reads (non-logged-in): 60 req/min per IP */
export const anonReadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'rl:anon-read',
  analytics: true,
});

/** API reads (logged-in): 120 req/min per user */
export const userReadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, '1 m'),
  prefix: 'rl:user-read',
  analytics: true,
});

/** API mutations (logged-in): 30 req/min per user */
export const mutationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'rl:mutation',
  analytics: true,
});
