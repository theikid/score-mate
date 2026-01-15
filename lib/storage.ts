import { Game } from '@/types/game';

const STORAGE_KEY = 'score-mate-games';

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

// Conversion des dates lors de la sérialisation/désérialisation
const serializeGame = (game: Game): string => {
  return JSON.stringify(game);
};

const deserializeGame = (json: string): Game => {
  const data = JSON.parse(json);
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    rounds: data.rounds.map((round: any) => ({
      ...round,
      timestamp: new Date(round.timestamp),
    })),
  };
};

// Sauvegarder une partie
export const saveGame = (game: Game): void => {
  if (!isLocalStorageAvailable()) return;

  try {
    const games = getAllGames();
    const existingIndex = games.findIndex((g) => g.id === game.id);

    if (existingIndex !== -1) {
      games[existingIndex] = game;
    } else {
      games.push(game);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(games.map(serializeGame)));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la partie:', error);
  }
};

// Récupérer une partie par ID
export const getGame = (id: string): Game | null => {
  if (!isLocalStorageAvailable()) return null;

  try {
    const games = getAllGames();
    return games.find((game) => game.id === id) || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la partie:', error);
    return null;
  }
};

// Récupérer toutes les parties
export const getAllGames = (): Game[] => {
  if (!isLocalStorageAvailable()) return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const gamesJson: string[] = JSON.parse(data);
    return gamesJson.map(deserializeGame);
  } catch (error) {
    console.error('Erreur lors de la récupération des parties:', error);
    return [];
  }
};

// Supprimer une partie
export const deleteGame = (id: string): void => {
  if (!isLocalStorageAvailable()) return;

  try {
    const games = getAllGames();
    const filteredGames = games.filter((game) => game.id !== id);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(filteredGames.map(serializeGame))
    );
  } catch (error) {
    console.error('Erreur lors de la suppression de la partie:', error);
  }
};

// Récupérer les parties en cours
export const getActiveGames = (): Game[] => {
  return getAllGames().filter((game) => game.status === 'in-progress');
};

// Récupérer les parties terminées
export const getCompletedGames = (): Game[] => {
  return getAllGames().filter((game) => game.status === 'completed');
};
