'use client';

import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { gruvboxDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
