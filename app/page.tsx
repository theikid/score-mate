'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Game } from '@/types/game';
import { getActiveGames, getCompletedGames, deleteGame } from '@/lib/storage';
import { getGameName, calculateTotals, getLeaderboard } from '@/lib/gameLogic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Play, Trash2, Trophy, ChevronDown, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  const router = useRouter();
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [completedGames, setCompletedGames] = useState<Game[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);
  const [gameToView, setGameToView] = useState<Game | null>(null);

  useEffect(() => {
    loadGames();

    // Recharger les parties quand la fenêtre reprend le focus
    const handleFocus = () => {
      loadGames();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadGames = () => {
    setActiveGames(getActiveGames());
    setCompletedGames(getCompletedGames());
  };

  const handleDeleteGame = (id: string) => {
    setGameToDelete(id);
  };

  const confirmDeleteGame = () => {
    if (gameToDelete) {
      deleteGame(gameToDelete);
      loadGames();
      setGameToDelete(null);
    }
  };

  const handlePlayGame = (id: string) => {
    router.push(`/game/${id}`);
  };

  const renderGameCard = (game: Game) => {
    const totals = calculateTotals(game);
    const playerNames = game.players.map((p) => p.name).join(', ');
    const lastUpdate = new Date(game.updatedAt);
    const leaderboard = getLeaderboard(game);
    const leader = leaderboard.length > 0 ? leaderboard[0] : null;

    const formatDate = (date: Date) => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
    };

    return (
      <Card
        key={game.id}
        className={`hover:shadow-md transition-shadow ${game.status === 'completed' ? 'cursor-pointer' : ''}`}
        onClick={() => game.status === 'completed' && setGameToView(game)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {getGameName(game.type)}
              </CardTitle>
              <CardDescription className="mt-1">
                {playerNames}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteGame(game.id);
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full border-destructive/30"
              aria-label="Supprimer la partie"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Manches jouées :</span>
              <span className="font-medium">{game.rounds.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Score cible :</span>
              <span className="font-medium">{game.targetScore}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dernière activité :</span>
              <span className="font-medium">{formatDate(lastUpdate)}</span>
            </div>
            {game.status === 'in-progress' && leader && game.rounds.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">En tête :</span>
                <span className="font-semibold text-primary">
                  {leader.playerName} ({leader.totalScore} pts)
                </span>
              </div>
            )}
            {game.status === 'completed' && game.winner && (
              <div className="mt-4 p-3 bg-yellow-500/10 border-2 border-yellow-500 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-500" aria-hidden="true" />
                  <span className="font-semibold text-base">
                    1. {game.players.find((p) => p.id === game.winner)?.name}
                  </span>
                </div>
                <span className="font-semibold text-base">{totals[game.winner]} pts</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="bg-background flex flex-col" style={{ height: '100dvh' }}>
      {/* Lien d'évitement */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Aller au contenu principal
      </a>

      {/* Header */}
      <header className="container max-w-2xl mx-auto px-4 safe-top pt-8 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold tracking-tight leading-none">
            Score Mate
          </h1>
          <ThemeToggle />
        </div>
        <p className="text-muted-foreground">
          Les scores, sans prise de tête
        </p>
      </header>

      {/* Contenu principal scrollable */}
      <main id="main-content" className="flex-1 overflow-y-auto min-h-0">
        <div className={`container max-w-2xl mx-auto px-4 h-full flex flex-col ${activeGames.length === 0 && completedGames.length === 0 ? 'pb-[120px]' : 'pb-4'}`}>
          <div className={`flex flex-col gap-6 py-4 ${activeGames.length === 0 && completedGames.length === 0 ? 'flex-1 justify-center' : ''}`}>
          {/* Partie en cours */}
          {activeGames.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Partie en cours</h2>
              {renderGameCard(activeGames[0])}
            </div>
          )}

          {/* Message quand aucune partie */}
          {activeGames.length === 0 && completedGames.length === 0 && (
            <div className="py-12 text-center text-muted-foreground border border-border rounded-lg">
              <p className="text-lg mb-2">Aucune partie en cours</p>
              <p className="text-sm">
                Créez une nouvelle partie pour commencer !
              </p>
            </div>
          )}

          {/* Parties terminées */}
          {completedGames.length > 0 && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full text-left"
                aria-expanded={showCompleted}
                aria-label={showCompleted ? "Masquer les parties terminées" : "Afficher les parties terminées"}
              >
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  Parties terminées ({completedGames.length})
                  {showCompleted ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  )}
                </h2>
              </button>
              {showCompleted && (
                <div className="space-y-3">
                  {completedGames.map(renderGameCard)}
                </div>
              )}
            </div>
          )}

          {/* Version */}
          {process.env.NEXT_PUBLIC_APP_VERSION && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Version {process.env.NEXT_PUBLIC_APP_VERSION}
            </div>
          )}
          </div>
        </div>
      </main>

      {/* Bouton nouvelle partie ou continuer - fixe en bas */}
      <footer className="fixed-bottom-button">
        <div className="w-full md:max-w-2xl mx-auto flex justify-center">
          {activeGames.length > 0 ? (
            <Button
              type="button"
              size="lg"
              onClick={() => handlePlayGame(activeGames[0].id)}
              className="w-full md:w-auto md:min-w-[320px] rounded-full gap-2 h-14 text-lg font-semibold"
            >
              <Play className="w-6 h-6" aria-hidden="true" />
              Continuer la partie
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={() => router.push('/new-game')}
              className="w-full md:w-auto md:min-w-[320px] rounded-full gap-2 h-14 text-lg font-semibold"
            >
              <Plus className="w-6 h-6" aria-hidden="true" />
              Nouvelle partie
            </Button>
          )}
        </div>
      </footer>

      {/* Modal de confirmation de suppression */}
      <AlertDialog open={gameToDelete !== null} onOpenChange={(open) => !open && setGameToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la partie</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette partie ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteGame} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de classement d'une partie terminée */}
      <Dialog open={gameToView !== null} onOpenChange={(open) => !open && setGameToView(null)}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" aria-hidden="true" />
              Classement final
            </DialogTitle>
          </DialogHeader>

          {gameToView && (
            <>
              {/* Informations de la partie */}
              <div className="text-center space-y-1 mb-4">
                <p className="text-lg font-semibold">{getGameName(gameToView.type)}</p>
                <p className="text-sm text-muted-foreground">
                  {gameToView.players.map((p) => p.name).join(', ')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {gameToView.rounds.length} {gameToView.rounds.length > 1 ? 'manches jouées' : 'manche jouée'}
                </p>
              </div>

              {/* Classement final */}
              <div className="space-y-2">
                {getLeaderboard(gameToView).map((player, index) => {
                  const totals = calculateTotals(gameToView);
                  return (
                    <div
                      key={player.playerId}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0
                          ? 'bg-yellow-500/20 border-2 border-yellow-500'
                          : 'bg-card border border-border'
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
                  );
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
