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

  async function handleGitHubLogin() {
    setStatus('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: getRedirectUrl(),
        }
      });
      if (error) throw error;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'GitHub login failed');
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
          className="btn btn-secondary oauth-btn" 
          onClick={handleGoogleLogin} 
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <button 
          type="button" 
          className="btn btn-secondary oauth-btn" 
          onClick={handleGitHubLogin} 
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Continue with GitHub
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
