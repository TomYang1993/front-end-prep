import { cache } from 'react';
import { prisma } from '@/lib/db/prisma';
import { createSupabaseServerClient } from '@/lib/auth/supabase';

export interface ServerSessionUser {
  id: string;
  email: string;
  roles: string[];
}

export const getCurrentServerUser = cache(async (): Promise<ServerSessionUser | null> => {
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (hasSupabaseEnv) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (!error && data.user?.id && data.user.email) {
      // Read-only lookup for the common case (user already exists)
      let user = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        include: { userRoles: { include: { role: true } } }
      });

      // Only upsert on first login (user doesn't exist yet)
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

  if (process.env.NODE_ENV !== 'production') {
    const devFallback = await prisma.user.findFirst({
      where: { email: 'demo@interview.dev' },
      include: { userRoles: { include: { role: true } } }
    });

    if (!devFallback) return null;
    return {
      id: devFallback.id,
      email: devFallback.email,
      roles: devFallback.userRoles.map((item) => item.role.key)
    };
  }

  return null;
});
