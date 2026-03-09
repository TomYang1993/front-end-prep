'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/questions`
        }
      });

      if (error) {
        throw error;
      }

      setStatus('Check your email for the sign-in link.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to send sign-in link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={sendMagicLink} className="form-stack feature-panel">
      <h1>Sign in</h1>
      <p>Use your email magic link to access submission history and premium content.</p>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        required
      />
      <button className="btn" disabled={loading} type="submit">
        {loading ? 'Sending link...' : 'Send magic link'}
      </button>
      {status ? <p>{status}</p> : null}
    </form>
  );
}
