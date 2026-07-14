import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';

// Minimal, dependency-free light/dark theme. Persists to localStorage("theme")
// and toggles the `.dark` class on <html> to match tailwind darkMode:"class".
// A pre-paint script in index.html applies the saved theme before render, so
// this provider never causes a flash — it just keeps React state in sync.

const STORAGE_KEY = 'theme';
const ThemeContext = createContext({ theme: 'light', resolvedTheme: 'light', setTheme: () => {} });

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
  } catch {
    return null;
  }
}

function applyThemeClass(theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children, defaultTheme = 'light' }) {
  const [theme, setThemeState] = useState(() => readStoredTheme() || defaultTheme);

  // Keep the <html> class and storage in lockstep with state.
  useEffect(() => {
    applyThemeClass(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* private mode — session only */ }
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState((prev) => (next === 'dark' || next === 'light' ? next : prev));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
