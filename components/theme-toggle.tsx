'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  // Éviter le flash pendant l'hydratation
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" aria-label="Toggle theme" disabled className="rounded-full">
        <Sun className="h-5 w-5" aria-hidden="true" />
      </Button>
    );
  }

  // Déterminer le thème actuel pour l'affichage
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleToggle = () => {
    // Toggle simple entre light et dark
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      className="rounded-full"
    >
      {isDark ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </Button>
  );
}
