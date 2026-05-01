import { vi } from 'vitest';

export interface FakeUser {
  id: string;
  email: string;
}

export function mockSupabaseClient(opts: {
  user?: FakeUser | null;
  exchangeError?: Error;
} = {}) {
  const { user = null, exchangeError } = opts;

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { provider: 'google', url: 'https://example/oauth' },
        error: null
      }),
      exchangeCodeForSession: vi.fn().mockResolvedValue(
        exchangeError
          ? { data: { user: null, session: null }, error: exchangeError }
          : {
              data: {
                user,
                session: user ? { access_token: 'tok', user } : null
              },
              error: null
            }
      ),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ error: null })
      }
    }
  };
}
