import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { SiteHeader } from '@/components/site-header';
import { HeaderWrapper } from '@/components/header-wrapper';
import { ToastProvider } from '@/components/toast-provider';
import { UserProvider } from '@/components/user-provider';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';

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

// Inline script to prevent flash of wrong theme (FOUC)
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var valid = ['light', 'dark', 'focus'];
    var theme = (stored && valid.indexOf(stored) !== -1) ? stored : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentServerUser();

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
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
