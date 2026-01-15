export type GameType = 'skyjo' | 'flip7';

export type ScoringSystem = 'lowest-wins' | 'highest-wins';

export type GameStatus = 'in-progress' | 'completed';

export interface Player {
  id: string;
  name: string;
}

export interface Round {
  id: string;
  scores: Record<string, number>; // playerId -> score
  timestamp: Date;
}

export interface Game {
  id: string;
  type: GameType;
  players: Player[];
  rounds: Round[];
  targetScore: number; // Skyjo: 100 (défaut), Flip 7: 200 (défaut)
  scoringSystem: ScoringSystem; // Skyjo: lowest-wins, Flip 7: highest-wins
  status: GameStatus;
  winner?: string; // playerId
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerTotal {
  playerId: string;
  playerName: string;
  totalScore: number;
  rank: number;
}
