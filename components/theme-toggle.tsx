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

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('theme');
  if (stored && THEME_ORDER.includes(stored as Theme)) return stored as Theme;
  return null;
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle({ className }: { className?: string } = {}) {
  const [theme, setTheme] = useState<Theme>('dark'); // Matches initial server render

  useEffect(() => {
    const stored = getStoredTheme();
    const resolved = stored || getSystemTheme();
    setTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, []);

  function cycle() {
    const idx = THEME_ORDER.indexOf(theme);
    const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
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
