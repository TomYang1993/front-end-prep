'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Focus } from 'lucide-react';

type Theme = 'light' | 'dark' | 'focus';

const THEME_ORDER: Theme[] = ['light', 'dark', 'focus'];
const THEME_ICONS: Record<Theme, React.ReactNode> = {
  light: <Sun size={18} />,
  dark: <Moon size={18} />,
  focus: <Focus size={18} />,
};
const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  focus: 'Focus',
};

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function writeThemeCookie(theme: Theme) {
  document.cookie = `theme=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function ThemeToggle({ className }: { className?: string } = {}) {
  const [theme, setTheme] = useState<Theme>('dark');

  // Sync with whatever server applied to <html data-theme>
  useEffect(() => {
    const applied = document.documentElement.getAttribute('data-theme') as Theme | null;
    if (applied && THEME_ORDER.includes(applied)) {
      setTheme(applied);
    }
  }, []);

  function cycle() {
    const idx = THEME_ORDER.indexOf(theme);
    const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    writeThemeCookie(next);
  }

  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];

  return (
    <button
      className={className || "w-8 h-8 inline-grid place-items-center border border-line rounded-lg bg-surface text-muted cursor-pointer transition-all duration-200 text-base hover:bg-bg-subtle hover:text-brand hover:border-brand hover:rotate-[15deg]"}
      type="button"
      onClick={cycle}
      aria-label={`Switch to ${THEME_LABELS[nextTheme]} mode`}
      title={`Current: ${THEME_LABELS[theme]} — Click for ${THEME_LABELS[nextTheme]}`}
    >
      {THEME_ICONS[theme]}
    </button>
  );
}
