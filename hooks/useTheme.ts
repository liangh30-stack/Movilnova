import { useEffect, useCallback } from 'react';
import { useLocalStorageState } from './useLocalStorageState';

export type ThemeMode = 'light' | 'dark';

const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useTheme = () => {
  const [mode, setMode] = useLocalStorageState<ThemeMode>({
    key: 'theme-mode',
    fallback: 'light',
  });

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode(prev => (prev === 'light' ? 'dark' : 'light'));
  }, [setMode]);

  const isDark = mode === 'dark';

  return { mode, setMode, toggleTheme, isDark } as const;
};
