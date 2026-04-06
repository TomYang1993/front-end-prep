import Link from 'next/link';
import { AuthControls } from '@/components/auth-controls';
import { ThemeToggle } from '@/components/theme-toggle';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';

export async function SiteHeader() {
  const user = await getCurrentServerUser();

  return (
    <header className="sticky top-0 z-10 border-b border-line-soft backdrop-blur-[16px] backdrop-saturate-[1.2] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] transition-[background,border-color] duration-200">
      <div className="flex justify-between items-center gap-4 min-h-[56px] px-6 max-md:px-4">
        <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-[0.92rem] tracking-tight">
          <span className="w-[30px] h-[30px] rounded-lg inline-grid place-items-center bg-brand text-brand-ink text-[0.75rem] font-extrabold transition-colors duration-200">WTF</span>
          <span>Whack The Fullstack Interview</span>
        </Link>
        <nav className="flex items-center gap-2.5 text-muted flex-wrap text-[0.88rem] [&_a]:px-2 [&_a]:py-1 [&_a]:rounded-lg [&_a]:transition-[color,background] [&_a]:duration-150 [&_a:hover]:text-ink [&_a:hover]:bg-bg-subtle">
          <Link href="/questions">Questions</Link>
          <ThemeToggle />
          <AuthControls email={user?.email || null} />
        </nav>
      </div>
    </header>
  );
}
