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
          <span className="brand-mark">IP</span>
          <span>Interview Platform</span>
        </Link>
        <nav className="nav-links">
          <Link href="/questions">Questions</Link>
          <Link href="/admin">Admin</Link>
          <ThemeToggle />
          <AuthControls email={user?.email || null} />
        </nav>
      </div>
    </header>
  );
}
