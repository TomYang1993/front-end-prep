import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { SiteHeader } from '@/components/site-header';
import { ToastProvider } from '@/components/toast-provider';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Interview Platform',
  description: 'LeetCode + GreatFrontEnd style practice platform for JS and React interviews.',
};

// Inline script to prevent flash of wrong theme (FOUC)
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ToastProvider>
          <SiteHeader />
          <main className="container page-shell">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
