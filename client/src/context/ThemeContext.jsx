import { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'shine_sparkle_theme';

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system';
    } catch {
      return 'system';
    }
  });

  const getSystemTheme = () => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const initialTheme = typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY) || 'system')
      : 'system';
    return initialTheme === 'system' ? getSystemTheme() : initialTheme;
  });

  // Apply theme to HTML attribute
  const applyTheme = (targetResolved) => {
    setResolvedTheme(targetResolved);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', targetResolved);
      if (targetResolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Sync theme changes
  useEffect(() => {
    const targetResolved = theme === 'system' ? getSystemTheme() : theme;
    applyTheme(targetResolved);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  // Listen to system changes when in system mode
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      const saved = localStorage.getItem(STORAGE_KEY) || 'system';
      if (saved === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'system') {
        // If system was dark, go to light; if system was light, go to dark
        return resolvedTheme === 'dark' ? 'light' : 'dark';
      }
      return prev === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

