import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createSupabaseServerClient } from '@/lib/auth/supabase';
import { readSessionCookie } from '@/lib/auth/session-cookie';

export interface SessionUser {
  id: string;
  email: string;
  roles: string[];
}

export async function getCurrentUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  // Dev header override
  const devUserId = process.env.NODE_ENV !== 'production' ? req.headers.get('x-user-id') : null;
  if (devUserId) {
    const devUser = await prisma.user.findUnique({
      where: { id: devUserId },
      include: { userRoles: { include: { role: true } } }
    });
    if (!devUser) return null;
    return {
      id: devUser.id,
      email: devUser.email,
      roles: devUser.userRoles.map((item) => item.role.key)
    };
  }

  // Fast path: session cookie
  const session = await readSessionCookie();
  if (session) return session;

  // Slow path: Bearer token → Supabase verify → DB lookup
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  if (bearerToken && hasSupabaseEnv) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser(bearerToken);
    if (!error && data.user?.id && data.user.email) {
      let user = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        include: { userRoles: { include: { role: true } } }
      });

      if (!user) {
        user = await prisma.user.upsert({
          where: { supabaseId: data.user.id },
          update: { email: data.user.email },
          create: {
            supabaseId: data.user.id,
            email: data.user.email,
            profile: {
              create: {
                displayName: data.user.user_metadata?.full_name || data.user.email.split('@')[0]
              }
            }
          },
          include: { userRoles: { include: { role: true } } }
        });
      }

      return {
        id: user.id,
        email: user.email,
        roles: user.userRoles.map((item) => item.role.key)
      };
    }
  }

  return null;
}

export async function requireUser(req: NextRequest): Promise<SessionUser> {
  const user = await getCurrentUserFromRequest(req);
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<SessionUser> {
  const user = await requireUser(req);
  if (!user.roles.includes('ADMIN')) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
