// src/components/ThemeToggle.jsx
'use client';

import { useState, useEffect, JSX } from 'react';

type Theme = 'light' | 'dark';

export default function ThemeToggle(): JSX.Element {
 const [theme, setTheme] = useState<Theme>('light');

// Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as Theme | null;
    if (savedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle handler
  const toggleTheme = (): void => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('app_theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
  <button
    type="button"
    onClick={toggleTheme}
    className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 font-medium text-sm text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
    aria-label="Toggle theme"
  >
    {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
  </button>
);
}
