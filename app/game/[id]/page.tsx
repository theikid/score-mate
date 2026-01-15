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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trophy } from 'lucide-react';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [roundScores, setRoundScores] = useState<Record<string, string>>({});
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);

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
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-4 pb-20">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3 pt-4">
            <Button variant="ghost" size="icon" tabIndex={0} onClick={handleCloseGame} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{getGameName(game.type)}</h1>
              <p className="text-sm text-muted-foreground">
                {getScoringDescription(game.scoringSystem)} • Cible :{' '}
                {game.targetScore} pts
              </p>
            </div>
          </div>

          {/* Tableau des scores */}
          <Card>
            <CardHeader>
              <CardTitle>Scores</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Manche</TableHead>
                    {game.players.map((player) => (
                      <TableHead key={player.id} className="text-center">
                        {player.name}
                        {leader.playerId === player.id &&
                          game.rounds.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-1 text-xs"
                            >
                              1er
                            </Badge>
                          )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {game.rounds.map((round, index) => (
                    <TableRow key={round.id}>
                      <TableCell className="font-medium">
                        Manche {index + 1}
                      </TableCell>
                      {game.players.map((player) => (
                        <TableCell
                          key={player.id}
                          className="text-center"
                        >
                          {round.scores[player.id]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {game.rounds.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={game.players.length + 1}
                        className="text-center text-muted-foreground py-8"
                      >
                        Aucune manche jouée. Commencez en saisissant les
                        scores ci-dessous.
                      </TableCell>
                    </TableRow>
                  )}
                  {/* Ligne des totaux */}
                  {game.rounds.length > 0 && (
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>TOTAL</TableCell>
                      {game.players.map((player) => (
                        <TableCell
                          key={player.id}
                          className="text-center"
                        >
                          {totals[player.id]}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Saisie nouvelle manche */}
          {game.status === 'in-progress' && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Nouvelle manche (#{game.rounds.length + 1})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {game.players.map((player) => (
                    <div key={player.id} className="flex items-center gap-3">
                      <label className="w-32 text-sm font-medium">
                        {player.name}
                      </label>
                      <Input
                        type="number"
                        placeholder="Score"
                        value={roundScores[player.id] || ''}
                        onChange={(e) =>
                          handleScoreChange(player.id, e.target.value)
                        }
                        className="flex-1"
                        inputMode="numeric"
                      />
                    </div>
                  ))}
                  <Button
                    onClick={handleAddRound}
                    className="w-full mt-4 gap-1.5"
                    size="lg"
                  >
                    <Plus className="w-5 h-5" />
                    Valider la manche
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Classement actuel */}
          {game.rounds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Classement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.map((player) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            player.rank === 1 ? 'default' : 'secondary'
                          }
                        >
                          #{player.rank}
                        </Badge>
                        <span className="font-medium">
                          {player.playerName}
                        </span>
                      </div>
                      <span className="font-semibold">
                        {player.totalScore} pts
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de victoire */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              Partie terminée !
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              {game.winner && (
                <>
                  <span className="font-bold text-foreground text-xl">
                    {
                      game.players.find((p) => p.id === game.winner)
                        ?.name
                    }
                  </span>
                  <br />
                  remporte la partie avec{' '}
                  {totals[game.winner]} points !
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Classement final */}
          <div className="space-y-2 mt-4">
            <h3 className="font-semibold text-center mb-3">
              Classement final
            </h3>
            {leaderboard.map((player, index) => (
              <div
                key={player.playerId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0
                    ? 'bg-yellow-500/20 border-2 border-yellow-500'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  {index === 0 && (
                    <Trophy className="w-5 h-5 text-yellow-500" />
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
              variant="outline"
              onClick={handleCloseGame}
              className="flex-1"
            >
              Retour à l'accueil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
