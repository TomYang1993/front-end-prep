'use client';

import { createContext, useContext, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'focus';

export const THEME_ORDER: Theme[] = ['light', 'dark', 'focus'];
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function applyTheme(next: Theme) {
  document.documentElement.setAttribute('data-theme', next);
  document.cookie = `theme=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
} | null>(null);

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = THEME_ORDER[(THEME_ORDER.indexOf(prev) + 1) % THEME_ORDER.length];
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
