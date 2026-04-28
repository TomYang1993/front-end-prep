'use client';

import { oneDark, oneLight, gruvboxDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/components/theme-provider';

const THEME_MAP: Record<string, typeof oneDark> = {
  light: oneLight,
  dark: oneDark,
  focus: gruvboxDark,
};

export function useSyntaxTheme() {
  const { theme } = useTheme();
  return THEME_MAP[theme] ?? oneDark;
}
