'use client';

import { Sun, Moon, Focus } from 'lucide-react';
import { useTheme, type Theme } from '@/components/theme-provider';

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

export function ThemeToggle({ className }: { className?: string } = {}) {
  const { theme, cycleTheme } = useTheme();

  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];

  return (
    <button
      className={className || "w-8 h-8 inline-grid place-items-center border border-line rounded-lg bg-surface text-muted cursor-pointer transition-all duration-200 text-base hover:bg-bg-subtle hover:text-brand hover:border-brand hover:rotate-[15deg]"}
      type="button"
      onClick={cycleTheme}
      aria-label={`Switch to ${THEME_LABELS[nextTheme]} mode`}
      title={`Current: ${THEME_LABELS[theme]} — Click for ${THEME_LABELS[nextTheme]}`}
    >
      {THEME_ICONS[theme]}
    </button>
  );
}
