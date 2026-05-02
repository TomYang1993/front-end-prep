import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const signInWithOAuth = vi.fn();

vi.mock('@/lib/auth/supabase-browser', () => ({
  createSupabaseBrowserClient: () => ({
    auth: { signInWithOAuth }
  })
}));

const searchParamsMap = new Map<string, string>();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (k: string) => searchParamsMap.get(k) ?? null
  })
}));

beforeEach(() => {
  signInWithOAuth.mockReset();
  signInWithOAuth.mockResolvedValue({ error: null });
  searchParamsMap.clear();
});

describe('<AuthForm />', () => {
  it('renders Google + GitHub buttons', async () => {
    const { AuthForm } = await import('@/components/auth-form');
    render(<AuthForm />);
    expect(screen.getByRole('button', { name: /google/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /github/i })).toBeTruthy();
  });

  it('Google button triggers signInWithOAuth(google)', async () => {
    const { AuthForm } = await import('@/components/auth-form');
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: /google/i }));
    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledTimes(1));
    expect(signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback?next=')
        })
      })
    );
  });

  it('GitHub button triggers signInWithOAuth(github)', async () => {
    const { AuthForm } = await import('@/components/auth-form');
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: /github/i }));
    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledTimes(1));
    expect(signInWithOAuth.mock.calls[0][0].provider).toBe('github');
  });

  it('forwards ?next param into redirect URL', async () => {
    searchParamsMap.set('next', '/questions/two-sum');
    const { AuthForm } = await import('@/components/auth-form');
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: /google/i }));
    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalled());
    const arg = signInWithOAuth.mock.calls[0][0];
    expect(arg.options.redirectTo).toContain('next=' + encodeURIComponent('/questions/two-sum'));
  });

  it('defaults next to /questions when search param missing', async () => {
    const { AuthForm } = await import('@/components/auth-form');
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: /github/i }));
    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalled());
    expect(signInWithOAuth.mock.calls[0][0].options.redirectTo).toContain(
      'next=' + encodeURIComponent('/questions')
    );
  });

  it('disables both buttons after click while loading', async () => {
    let resolveCall!: (v: unknown) => void;
    signInWithOAuth.mockImplementation(
      () => new Promise(res => { resolveCall = res; })
    );
    const { AuthForm } = await import('@/components/auth-form');
    render(<AuthForm />);
    const google = screen.getByRole('button', { name: /google/i });
    const github = screen.getByRole('button', { name: /github/i });
    fireEvent.click(google);
    await waitFor(() => {
      expect((google as HTMLButtonElement).disabled).toBe(true);
      expect((github as HTMLButtonElement).disabled).toBe(true);
    });
    resolveCall({ error: null });
  });

  it('surfaces OAuth error message', async () => {
    signInWithOAuth.mockResolvedValue({ error: new Error('OAuth provider down') });
    const { AuthForm } = await import('@/components/auth-form');
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: /google/i }));
    await waitFor(() => {
      expect(screen.queryByText(/OAuth provider down/i)).toBeTruthy();
    });
  });
});
