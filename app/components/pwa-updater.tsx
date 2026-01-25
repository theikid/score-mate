'use client';

import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'score-mate-app-version';
const DEBOUNCE_DELAY = 30000; // 30 secondes

export function PWAUpdater() {
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    // Vérifier si le navigateur supporte les Service Workers
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    async function checkForUpdate() {
      const now = Date.now();

      // Debounce : ne pas vérifier trop souvent
      if (now - lastCheckRef.current < DEBOUNCE_DELAY) {
        return;
      }

      lastCheckRef.current = now;

      try {
        // Récupérer la version depuis l'API
        const response = await fetch('/api/version', {
          cache: 'no-store',
        });

        if (!response.ok) {
          console.warn('[PWA Updater] Impossible de récupérer la version');
          return;
        }

        const data = await response.json();
        const serverVersion = data.version;

        // Récupérer la version stockée localement
        const localVersion = localStorage.getItem(STORAGE_KEY);

        if (!localVersion) {
          // Première visite, stocker la version actuelle
          localStorage.setItem(STORAGE_KEY, serverVersion);
          console.log('[PWA Updater] Version initiale:', serverVersion);
          return;
        }

        if (localVersion !== serverVersion) {
          console.log('[PWA Updater] Nouvelle version détectée:', serverVersion);

          // Mettre à jour la version dans localStorage
          localStorage.setItem(STORAGE_KEY, serverVersion);

          // Déclencher la mise à jour du Service Worker
          const registration = await navigator.serviceWorker.getRegistration();

          if (registration) {
            await registration.update();
            console.log('[PWA Updater] Service Worker mis à jour');
          }
        }
      } catch (error) {
        console.error('[PWA Updater] Erreur lors de la vérification:', error);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    }

    function handleFocus() {
      checkForUpdate();
    }

    // Écouter les changements de visibilité et de focus
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Écouter les changements de contrôleur du Service Worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA Updater] Nouveau contrôleur détecté, reload de la page');
      window.location.reload();
    });

    // Vérifier au montage du composant
    checkForUpdate();

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Ce composant ne rend rien
  return null;
}
