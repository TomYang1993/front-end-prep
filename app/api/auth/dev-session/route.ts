import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { writeSessionCookie } from '@/lib/auth/session-cookie';

/**
 * Dev-only route: resolves the demo user from DB and writes the session cookie.
 * Middleware redirects here once when no session cookie exists in dev mode.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const user = await prisma.user.findFirst({
    where: { email: 'demo@interview.dev' },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: 'Run prisma:seed first' }, { status: 500 });
  }

  await writeSessionCookie({
    id: user.id,
    email: user.email,
    roles: user.userRoles.map((r) => r.role.key),
  });

  // Redirect back to where the user originally wanted to go
  const next = req.nextUrl.searchParams.get('next') || '/questions';
  return NextResponse.redirect(new URL(next, req.url));
}
