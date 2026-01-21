'use client';

import { useEffect, useState } from 'react';
import { Theme, getTheme, setTheme as saveTheme, getAppliedTheme, getSystemTheme } from '@/lib/theme';

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Charger le thème sauvegardé au montage
  useEffect(() => {
    const savedTheme = getTheme();
    setThemeState(savedTheme);
    setMounted(true);
  }, []);

  // Appliquer le thème au document
  useEffect(() => {
    if (!mounted) return;

    const appliedTheme = getAppliedTheme(theme);
    const root = document.documentElement;

    if (appliedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, mounted]);

  // Écouter les changements de préférence système si mode 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const appliedTheme = getSystemTheme();
      const root = document.documentElement;

      if (appliedTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Fonction pour changer le thème
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  };

  return { theme, setTheme, mounted };
};
