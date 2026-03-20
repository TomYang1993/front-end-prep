'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'kinetic';

const THEME_ORDER: Theme[] = ['light', 'dark', 'kinetic'];
const THEME_ICONS: Record<Theme, string> = {
  light: '☀️',
  dark: '🌙',
  kinetic: '⚡',
};
const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  kinetic: 'Kinetic',
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

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) {
    return <button className="theme-toggle" type="button" aria-label="Toggle theme">⏳</button>;
  }

  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={cycle}
      aria-label={`Switch to ${THEME_LABELS[nextTheme]} mode`}
      title={`Current: ${THEME_LABELS[theme]} — Click for ${THEME_LABELS[nextTheme]}`}
    >
      {THEME_ICONS[theme]}
    </button>
  );
}
