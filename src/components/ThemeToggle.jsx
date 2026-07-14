import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { Sun, Moon } from 'lucide-react';

/**
 * One-tap light/dark flip. Reads/writes the ThemeContext (persisted to
 * localStorage "theme"); the pre-paint script in index.html applies the saved
 * theme before render so there is no flash.
 *
 * variant "icon"  — compact icon button (sidebar footer, top bars)
 * variant "full"  — icon + label row (mobile menus, settings lists)
 */
export default function ThemeToggle({ variant = 'icon', className = '' }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The provider resolves the real theme after mount; render a stable
  // placeholder first so the icon never flips on load.
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const nextLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={nextLabel}
        title={nextLabel}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${className}`}
      >
        {isDark ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
        <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={nextLabel}
      title={nextLabel}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${className}`}
    >
      {/* Suppressed until mounted so it doesn't flash the wrong glyph */}
      {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
    </button>
  );
}
