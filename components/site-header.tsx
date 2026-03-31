import Link from 'next/link';
import { AuthControls } from '@/components/auth-controls';
import { ThemeToggle } from '@/components/theme-toggle';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';

export async function SiteHeader() {
  const user = await getCurrentServerUser();

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link href="/" className="brand">
          <span className="brand-mark">WTF</span>
          <span>Whack The Fullstack Interview</span>
        </Link>
        <nav className="nav-links">
          <Link href="/questions">Questions</Link>
          <Link href="/pricing">Pricing</Link>
          <ThemeToggle />
          <AuthControls email={user?.email || null} />
        </nav>
      </div>
    </header>
  );
}
