'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser';

interface AuthControlsProps {
  email: string | null;
}

export function AuthControls({ email }: AuthControlsProps) {
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  if (!email) {
    return (
        <Link href="/auth" className="btn btn-secondary">
          Sign in
        </Link>
    );
  }

  return (
    <div className="auth-controls">
      <span>{email}</span>
      <button type="button" className="btn btn-secondary" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
