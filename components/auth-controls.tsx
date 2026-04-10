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
    await fetch('/api/auth/sign-out', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  if (!email) {
    return (
        <Link href="/auth" className="px-2.5 py-[0.3rem] rounded-lg border border-line text-ink font-medium transition-all duration-150 hover:bg-bg-subtle hover:border-muted">
          Sign in
        </Link>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 text-[0.82rem]">
      <span>{email}</span>
      <button type="button" className="px-2.5 py-[0.3rem] rounded-lg border border-line text-ink font-medium transition-all duration-150 hover:bg-bg-subtle hover:border-muted" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
