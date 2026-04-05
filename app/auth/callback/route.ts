import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createSupabaseServerClient } from '@/lib/auth/supabase';
import { writeSessionCookie } from '@/lib/auth/session-cookie';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const next = req.nextUrl.searchParams.get('next') || '/questions';
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  if (code && hasSupabaseEnv) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // After successful login, resolve DB user and write session cookie
    if (!error && data.session?.user?.id && data.session?.user?.email) {
      const sbId = data.session.user.id;
      const sbEmail = data.session.user.email;
      const sbName = data.session.user.user_metadata?.full_name as string | undefined;

      const user = await prisma.user.upsert({
        where: { supabaseId: sbId },
        update: { email: sbEmail },
        create: {
          supabaseId: sbId,
          email: sbEmail,
          profile: {
            create: { displayName: sbName || sbEmail.split('@')[0] },
          },
        },
        include: { userRoles: { include: { role: true } } },
      });

      await writeSessionCookie({
        id: user.id,
        email: user.email,
        roles: user.userRoles.map((r) => r.role.key),
      });
    }
  }

  return NextResponse.redirect(new URL(next, req.url));
}
