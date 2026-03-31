import { cache } from 'react';
import { readSessionCookie } from '@/lib/auth/session-cookie';

export interface ServerSessionUser {
  id: string;
  email: string;
  roles: string[];
}

/**
 * Read the current user from the session cookie. ~0ms.
 *
 * The cookie is set at login (auth callback) or by middleware (dev mode).
 * If no cookie exists, the user is anonymous — returns null.
 * No DB calls, no Supabase calls, no network.
 */
export const getCurrentServerUser = cache(async (): Promise<ServerSessionUser | null> => {
  return readSessionCookie();
});
