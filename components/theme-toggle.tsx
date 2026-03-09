'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('theme') as Theme | null;
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

    function toggle() {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    }

    // Avoid flash of wrong icon during SSR
    if (!mounted) {
        return <button className="theme-toggle" type="button" aria-label="Toggle theme">⏳</button>;
    }

    return (
        <button
            className="theme-toggle"
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
}
