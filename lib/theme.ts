export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'score-mate-theme';

// Vérifie si localStorage est disponible (SSR-safe)
const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Récupérer le thème du système
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Récupérer le thème appliqué basé sur le thème sélectionné
export const getAppliedTheme = (theme: Theme): 'light' | 'dark' => {
  return theme === 'system' ? getSystemTheme() : theme;
};

// Récupérer le thème sauvegardé
export const getTheme = (): Theme => {
  if (!isLocalStorageAvailable()) return 'system';

  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      return savedTheme;
    }
    return 'system';
  } catch (error) {
    console.error('Erreur lors de la récupération du thème:', error);
    return 'system';
  }
};

// Sauvegarder le thème
export const setTheme = (theme: Theme): void => {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du thème:', error);
  }
};
