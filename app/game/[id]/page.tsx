'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Game } from '@/types/game';
import { getGame, saveGame } from '@/lib/storage';
import {
  addRound,
  calculateTotals,
  getGameName,
  getScoringDescription,
  getLeaderboard,
} from '@/lib/gameLogic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trophy, Calculator, X, ChevronDown, ChevronUp } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Calculator as CalculatorComponent } from '@/components/calculator';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [roundScores, setRoundScores] = useState<Record<string, string>>({});
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState<string | null>(null);
  const [isScoreEntryExpanded, setIsScoreEntryExpanded] = useState(true);

  useEffect(() => {
    const loadedGame = getGame(gameId);
    if (!loadedGame) {
      router.push('/');
      return;
    }
    setGame(loadedGame);

    // Initialiser les inputs de scores
    const initialScores: Record<string, string> = {};
    loadedGame.players.forEach((player) => {
      initialScores[player.id] = '';
    });
    setRoundScores(initialScores);

    // Afficher la modal si la partie est terminée
    if (loadedGame.status === 'completed') {
      setShowWinnerDialog(true);
    }
  }, [gameId, router]);

  const handleScoreChange = (playerId: string, value: string) => {
    setRoundScores((prev) => ({
      ...prev,
      [playerId]: value,
    }));
  };

  const handleAddRound = () => {
    if (!game) return;

    // Vérifier que tous les scores sont saisis
    const scores: Record<string, number> = {};
    let allScoresValid = true;

    game.players.forEach((player) => {
      const scoreStr = roundScores[player.id];
      if (scoreStr === '' || scoreStr === undefined) {
        allScoresValid = false;
        return;
      }
      const score = parseInt(scoreStr);
      if (isNaN(score)) {
        allScoresValid = false;
        return;
      }
      scores[player.id] = score;
    });

    if (!allScoresValid) {
      alert('Veuillez saisir un score valide pour chaque joueur');
      return;
    }

    // Ajouter la manche
    const updatedGame = addRound(game, scores);
    saveGame(updatedGame);
    setGame(updatedGame);

    // Réinitialiser les inputs
    const resetScores: Record<string, string> = {};
    game.players.forEach((player) => {
      resetScores[player.id] = '';
    });
    setRoundScores(resetScores);

    // Afficher la modal si la partie est terminée
    if (updatedGame.status === 'completed') {
      setShowWinnerDialog(true);
    }
  };

  const handleCloseGame = () => {
    router.push('/');
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  const totals = calculateTotals(game);
  const leaderboard = getLeaderboard(game);
  const leader = leaderboard[0];

  return (
    <div className="bg-background flex flex-col" style={{ height: '100dvh' }}>
      {/* Lien d'évitement */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Aller au contenu principal
      </a>

      {/* Contenu scrollable */}
      <div className={`flex-1 flex flex-col overflow-y-auto min-h-0 ${game.status === 'completed' ? 'pb-4' : isScoreEntryExpanded ? 'pb-[300px]' : 'pb-6'} md:pb-4`}>
        {/* Header Score Mate - STICKY EN HAUT */}
        <header
          className="sticky top-0 z-10 bg-background"
          style={{
            opacity: 0.95,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          <div className="container max-w-4xl mx-auto px-4">
            <div className="flex items-start justify-between safe-top pt-8 pb-4 border-b border-border">
              <Button variant="ghost" size="icon" onClick={handleCloseGame} className="rounded-full -ml-2" aria-label="Retour à l'accueil">
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </Button>
              <div className="flex-1 text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                  Score Mate
                </h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main id="main-content" className="container max-w-4xl mx-auto px-4">
        <div className="flex flex-col gap-6">
          {/* Info de la partie */}
          <div className="pt-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{getGameName(game.type)}</h2>
              <p className="text-sm text-muted-foreground">
                {getScoringDescription(game.scoringSystem)} • Cible : {game.targetScore} pts
              </p>
            </div>
          </div>

          {/* Classement & Historique - affiché uniquement si au moins 1 manche jouée */}
          {game.rounds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Classement & Historique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Classement actuel */}
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => {
                    const player = game.players.find((p) => p.id === entry.playerId);
                    if (!player) return null;
                    const isWinner = game.status === 'completed' && game.winner === player.id;
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between py-2 px-3 rounded-lg ${isWinner ? 'bg-yellow-500/10' : 'bg-muted/30'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? 'default' : 'secondary'} className="text-xs min-w-[32px] justify-center">
                            {index + 1}
                          </Badge>
                          <span className={`font-medium ${isWinner ? 'text-yellow-500' : ''}`}>{player.name}</span>
                          {isWinner && <Trophy className="w-4 h-4 text-yellow-500" aria-hidden="true" />}
                        </div>
                        <span className={`font-semibold text-lg ${isWinner ? 'text-yellow-500' : ''}`}>{entry.totalScore} pts</span>
                      </div>
                    );
                  })}
                </div>

                {/* Historique */}
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Détail des manches</h4>

                  {/* Historique en colonnes */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-semibold text-xs text-muted-foreground">Joueur</th>
                          {game.rounds.map((round, index) => (
                            <th key={round.id} className="text-center py-2 px-2 font-semibold text-xs text-muted-foreground">
                              M{index + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {game.players.map((player) => (
                          <tr key={player.id} className="border-b last:border-0">
                            <td className="py-2 px-2 font-medium">{player.name}</td>
                            {game.rounds.map((round) => (
                              <td key={round.id} className="text-center py-2 px-2">
                                {round.scores[player.id]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
        </main>
      </div>

      {/* Saisie nouvelle manche - fixe en bas sur mobile */}
      {game.status === 'in-progress' && (
        <footer className={`fixed-bottom-button ${!isScoreEntryExpanded ? '!py-6' : ''}`}>
          <div className="fixed-bottom-button-content">
            <div className="container max-w-4xl mx-auto">
              <div className="space-y-6">
              <button
                onClick={() => setIsScoreEntryExpanded(!isScoreEntryExpanded)}
                className="flex items-center justify-between w-full text-left"
                aria-expanded={isScoreEntryExpanded}
                aria-label={isScoreEntryExpanded ? "Réduire la saisie des scores" : "Développer la saisie des scores"}
              >
                <h3 className="text-xl font-bold">
                  Manche {game.rounds.length + 1} (en cours)
                </h3>
                {isScoreEntryExpanded ? (
                  <ChevronDown className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <ChevronUp className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
              {isScoreEntryExpanded && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {game.players.map((player) => (
                    <div key={player.id} className="flex items-center gap-3">
                      <label htmlFor={`score-${player.id}`} className="w-32 text-sm font-medium">
                        {player.name}
                      </label>
                      <div className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                          <Input
                            id={`score-${player.id}`}
                            type="number"
                            placeholder="Score"
                            value={roundScores[player.id] || ''}
                            onChange={(e) =>
                              handleScoreChange(player.id, e.target.value)
                            }
                            className={roundScores[player.id] ? 'pr-10' : ''}
                            inputMode="numeric"
                          />
                          {roundScores[player.id] && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleScoreChange(player.id, '')}
                              aria-label={`Effacer le score de ${player.name}`}
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            >
                              <X className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCalculatorOpen(player.id)}
                          aria-label={`Ouvrir la calculatrice pour ${player.name}`}
                        >
                          <Calculator className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={handleAddRound}
                    className="w-full mt-4 gap-2 h-14 text-lg font-semibold rounded-full"
                    size="lg"
                  >
                    <Plus className="w-6 h-6" aria-hidden="true" />
                    Valider la manche
                  </Button>
                </div>
              )}
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Modal de victoire */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" aria-hidden="true" />
              {game.winner && (
                <>
                  {game.players.find((p) => p.id === game.winner)?.name} remporte la partie
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Classement final */}
          <div className="space-y-2 mt-4">
            <h3 className="font-normal text-center mb-3">
              Classement final
            </h3>
            {leaderboard.map((player, index) => (
              <div
                key={player.playerId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0
                    ? 'bg-yellow-500/20 border-2 border-yellow-500'
                    : 'bg-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  {index === 0 && (
                    <Trophy className="w-5 h-5 text-yellow-500" aria-hidden="true" />
                  )}
                  <span
                    className={
                      index === 0 ? 'font-bold' : 'font-medium'
                    }
                  >
                    {player.rank}. {player.playerName}
                  </span>
                </div>
                <span className="font-semibold">
                  {player.totalScore} pts
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              size="lg"
              onClick={handleCloseGame}
              className="flex-1 h-14 text-lg font-semibold rounded-full focus-visible:outline-0 focus-visible:ring-0"
            >
              Retour à l'accueil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calculatrice */}
      <CalculatorComponent
        isOpen={calculatorOpen !== null}
        onClose={() => setCalculatorOpen(null)}
        onValidate={(result) => {
          if (calculatorOpen) {
            handleScoreChange(calculatorOpen, result.toString());
            setCalculatorOpen(null);
          }
        }}
        playerName={
          calculatorOpen
            ? game.players.find((p) => p.id === calculatorOpen)?.name
            : undefined
        }
        initialValue={calculatorOpen ? roundScores[calculatorOpen] : undefined}
      />
    </div>
  );
}
