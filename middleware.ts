import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const restrictedPrefixes = ['/submissions', '/admin'];
  const requiresAuth = restrictedPrefixes.some((prefix) => req.nextUrl.pathname.startsWith(prefix));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const hasSupabaseSession = Boolean(req.cookies.get('sb-access-token')?.value || req.cookies.get('sb-refresh-token')?.value);

  if (!hasSupabaseSession && process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('/questions', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/submissions/:path*', '/admin/:path*']
};
