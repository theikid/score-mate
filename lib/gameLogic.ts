import { Game, GameType, Player, PlayerTotal, Round, ScoringSystem } from '@/types/game';
import { nanoid } from 'nanoid';

// Créer une nouvelle partie
export const createGame = (
  type: GameType,
  players: string[],
  targetScore?: number
): Game => {
  // Configuration selon le type de jeu
  const config = {
    skyjo: {
      scoringSystem: 'lowest-wins' as ScoringSystem,
      defaultTargetScore: 100,
    },
    flip7: {
      scoringSystem: 'highest-wins' as ScoringSystem,
      defaultTargetScore: 200,
    },
  };

  const gameConfig = config[type];
  const now = new Date();

  return {
    id: nanoid(),
    type,
    players: players.map((name) => ({
      id: nanoid(),
      name,
    })),
    rounds: [],
    targetScore: targetScore ?? gameConfig.defaultTargetScore,
    scoringSystem: gameConfig.scoringSystem,
    status: 'in-progress',
    createdAt: now,
    updatedAt: now,
  };
};

// Ajouter une manche
export const addRound = (
  game: Game,
  scores: Record<string, number>
): Game => {
  const newRound: Round = {
    id: nanoid(),
    scores,
    timestamp: new Date(),
  };

  const updatedGame: Game = {
    ...game,
    rounds: [...game.rounds, newRound],
    updatedAt: new Date(),
  };

  // Vérifier si quelqu'un a gagné
  const winner = checkWinner(updatedGame);
  if (winner) {
    updatedGame.status = 'completed';
    updatedGame.winner = winner;
  }

  return updatedGame;
};

// Calculer les totaux pour chaque joueur
export const calculateTotals = (game: Game): Record<string, number> => {
  const totals: Record<string, number> = {};

  // Initialiser tous les joueurs à 0
  game.players.forEach((player) => {
    totals[player.id] = 0;
  });

  // Additionner les scores de toutes les manches
  game.rounds.forEach((round) => {
    Object.entries(round.scores).forEach(([playerId, score]) => {
      totals[playerId] = (totals[playerId] || 0) + score;
    });
  });

  return totals;
};

// Vérifier si quelqu'un a gagné
export const checkWinner = (game: Game): string | null => {
  const totals = calculateTotals(game);
  const entries = Object.entries(totals);

  if (entries.length === 0) return null;

  // Vérifier si au moins un joueur a atteint le score cible
  const hasReachedTarget = entries.some(
    ([_, total]) => Math.abs(total) >= game.targetScore
  );

  if (!hasReachedTarget) return null;

  // Déterminer le gagnant selon le système de scoring
  if (game.scoringSystem === 'lowest-wins') {
    // Le joueur avec le score le plus BAS gagne
    const [winnerId] = entries.reduce((min, current) =>
      current[1] < min[1] ? current : min
    );
    return winnerId;
  } else {
    // Le joueur avec le score le plus HAUT gagne
    const [winnerId] = entries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );
    return winnerId;
  }
};

// Obtenir le classement des joueurs
export const getLeaderboard = (game: Game): PlayerTotal[] => {
  const totals = calculateTotals(game);

  const leaderboard = game.players.map((player) => ({
    playerId: player.id,
    playerName: player.name,
    totalScore: totals[player.id] || 0,
    rank: 0,
  }));

  // Trier selon le système de scoring
  const sorted = [...leaderboard].sort((a, b) => {
    if (game.scoringSystem === 'lowest-wins') {
      return a.totalScore - b.totalScore; // Ordre croissant (le plus bas en premier)
    } else {
      return b.totalScore - a.totalScore; // Ordre décroissant (le plus haut en premier)
    }
  });

  // Attribuer les rangs
  sorted.forEach((player, index) => {
    player.rank = index + 1;
  });

  return sorted;
};

// Obtenir le nom du jeu en français
export const getGameName = (type: GameType): string => {
  return type === 'skyjo' ? 'Skyjo' : 'Flip 7';
};

// Obtenir la description du système de scoring
export const getScoringDescription = (scoringSystem: ScoringSystem): string => {
  return scoringSystem === 'lowest-wins'
    ? 'Le score le plus bas gagne'
    : 'Le score le plus haut gagne';
};
