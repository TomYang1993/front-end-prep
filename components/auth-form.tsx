'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser';

type AuthMode = 'login' | 'register' | 'magic';

export function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createSupabaseBrowserClient();
  const getRedirectUrl = () => `${window.location.origin}/auth/callback?next=/questions`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    setLoading(true);

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: getRedirectUrl() }
        });
        if (error) throw error;
        setStatus('Check your email for the magic link.');
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: getRedirectUrl() }
        });
        if (error) throw error;
        setStatus('Registration successful! Please check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        router.push('/questions');
        router.refresh();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setStatus('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
        }
      });
      if (error) throw error;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Google login failed');
      setLoading(false);
    }
  }

  return (
    <div className="feature-panel" style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
      <form onSubmit={handleSubmit} className="form-stack">
        <h1>
          {mode === 'login' && 'Sign In'}
          {mode === 'register' && 'Create Account'}
          {mode === 'magic' && 'Magic Link Login'}
        </h1>
        
        {mode === 'magic' ? (
          <p>Use your email magic link to access submission history and premium content without a password.</p>
        ) : (
          <p>Sign in to access your submission history and premium content.</p>
        )}

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />

        {mode !== 'magic' && (
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            minLength={6}
          />
        )}

        <button className="btn" disabled={loading} type="submit">
          {loading ? 'Processing...' : (
            mode === 'login' ? 'Sign in' : 
            mode === 'register' ? 'Register' : 
            'Send magic link'
          )}
        </button>

        {status && <p style={{ color: 'var(--brand)', fontSize: '0.88rem', fontWeight: 500 }}>{status}</p>}
      </form>

      <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
        <div style={{ flex: 1, backgroundColor: 'var(--muted)', height: 1, opacity: 0.3 }} />
        <span style={{ padding: '0 1rem', fontSize: '0.88rem', color: 'var(--muted)' }}>OR</span>
        <div style={{ flex: 1, backgroundColor: 'var(--muted)', height: 1, opacity: 0.3 }} />
      </div>

      <div className="form-stack">
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={handleGoogleLogin} 
          disabled={loading}
        >
          Continue with Google
        </button>

        {mode === 'login' && (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => { setMode('register'); setStatus(''); }} disabled={loading}>
              Create a new account
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => { setMode('magic'); setStatus(''); }} disabled={loading}>
              Use a Magic Link instead
            </button>
          </>
        )}

        {mode === 'register' && (
          <button type="button" className="btn btn-secondary" onClick={() => { setMode('login'); setStatus(''); }} disabled={loading}>
            Already have an account? Sign in
          </button>
        )}

        {mode === 'magic' && (
          <button type="button" className="btn btn-secondary" onClick={() => { setMode('login'); setStatus(''); }} disabled={loading}>
            Sign in with Password instead
          </button>
        )}
      </div>
    </div>
  );
}
