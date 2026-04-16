import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { SiteHeader } from '@/components/site-header';
import { HeaderWrapper } from '@/components/header-wrapper';
import { ToastProvider } from '@/components/toast-provider';
import { UserProvider } from '@/components/user-provider';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';

const VALID_THEMES = ['light', 'dark', 'focus'] as const;
type Theme = typeof VALID_THEMES[number];
const DEFAULT_THEME: Theme = 'dark';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'block',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'block',
});

export const metadata: Metadata = {
  title: 'Whack The Fullstack Interview',
  description: 'LeetCode + GreatFrontEnd style practice platform for JS and React interviews.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, cookieStore] = await Promise.all([getCurrentServerUser(), cookies()]);
  const cookieTheme = cookieStore.get('theme')?.value;
  const theme: Theme = VALID_THEMES.includes(cookieTheme as Theme) ? (cookieTheme as Theme) : DEFAULT_THEME;

  return (
    <html lang="en" data-theme={theme} className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <body>
        <UserProvider user={user}>
          <ToastProvider>
            <HeaderWrapper>
              <SiteHeader />
            </HeaderWrapper>
            <main className="container page-shell">{children}</main>
          </ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
