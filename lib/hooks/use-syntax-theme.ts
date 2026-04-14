'use client';

import { useEffect, useState } from 'react';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { gruvboxDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const THEME_MAP: Record<string, typeof oneDark> = {
  light: oneLight,
  dark: oneDark,
  focus: gruvboxDark,
};

export function useSyntaxTheme() {
  const [style, setStyle] = useState(oneDark);

  useEffect(() => {
    function update() {
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      setStyle(THEME_MAP[theme] ?? oneDark);
    }

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return style;
}
