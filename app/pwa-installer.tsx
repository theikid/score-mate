'use client';

import { useEffect } from 'react';

export function PWAInstaller() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker enregistré:', registration);
        })
        .catch((error) => {
          console.error('[PWA] Erreur enregistrement Service Worker:', error);
        });
    }
  }, []);

  return null;
}
