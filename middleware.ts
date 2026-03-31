import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session-cookie';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // In dev mode we used to auto-login here — removed so real auth flow works.

  // ── Protected routes: require session ──
  const restrictedPrefixes = ['/submissions', '/admin'];
  const requiresAuth = restrictedPrefixes.some((prefix) =>
    req.nextUrl.pathname.startsWith(prefix)
  );

  if (requiresAuth && !session) {
    return NextResponse.redirect(new URL('/questions', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all page routes, skip static assets and API routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
