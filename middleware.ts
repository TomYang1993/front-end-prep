import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session-cookie';
import { globalLimiter, authLimiter, anonReadLimiter, userReadLimiter, mutationLimiter } from '@/lib/rate-limit';

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function rateLimitResponse() {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': '60' } }
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Refresh Supabase auth cookies (critical for PKCE code verifier on OAuth callback)
  let response = NextResponse.next({ request: req });
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
            response = NextResponse.next({ request: req });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
            );
          },
        },
      }
    );
    await supabase.auth.getUser();
  }
  const ip = getIP(req);

  // Verify session once — used for both rate limit keying and auth gating.
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // ── Rate limiting (skipped if Upstash is not configured) ──
  if (process.env.UPSTASH_REDIS_REST_URL) {
    // Global catch-all (all routes, by IP)
    const globalResult = await globalLimiter.limit(ip);
    if (!globalResult.success) return rateLimitResponse();

    // Tighter limit on auth routes
    if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
      const authResult = await authLimiter.limit(ip);
      if (!authResult.success) return rateLimitResponse();
    }

    // API reads vs mutations
    if (pathname.startsWith('/api/')) {
      const isMutation = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';

      if (session) {
        const limiter = isMutation ? mutationLimiter : userReadLimiter;
        const result = await limiter.limit(session.id);
        if (!result.success) return rateLimitResponse();
      } else {
        const result = await anonReadLimiter.limit(ip);
        if (!result.success) return rateLimitResponse();
      }
    }
  }

  // ── Protected routes: require session ──
  const restrictedPrefixes = ['/submissions', '/admin'];
  const requiresAuth = restrictedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (requiresAuth && !session) {
    return NextResponse.redirect(new URL('/questions', req.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
