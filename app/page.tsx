'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Game } from '@/types/game';
import { getActiveGames, getCompletedGames, deleteGame } from '@/lib/storage';
import { getGameName, calculateTotals, getLeaderboard } from '@/lib/gameLogic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Trash2, Trophy, ChevronDown, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  const router = useRouter();
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [completedGames, setCompletedGames] = useState<Game[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

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
    if (confirm('Êtes-vous sûr de vouloir supprimer cette partie ?')) {
      deleteGame(id);
      loadGames();
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
      <Card key={game.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {getGameName(game.type)}
                {game.status === 'completed' && game.winner && (
                  <Badge variant="secondary" className="ml-2">
                    <Trophy className="w-3 h-3 mr-1" />
                    {game.players.find((p) => p.id === game.winner)?.name}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {playerNames}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              tabIndex={0}
              onClick={() => handleDeleteGame(game.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full border-destructive/30"
            >
              <Trash2 className="h-4 w-4" />
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
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-center">
                  <span className="font-semibold">
                    {game.players.find((p) => p.id === game.winner)?.name}
                  </span>{' '}
                  remporte la partie avec {totals[game.winner]} points
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="bg-background flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="container max-w-2xl mx-auto px-4 flex items-start justify-between safe-top pt-4 pb-4 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Score Mate
          </h1>
          <p className="text-muted-foreground">
            Les scores, sans prise de tête
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Contenu principal scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="container max-w-2xl mx-auto px-4 h-full flex flex-col pb-4">
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
                tabIndex={0}
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full text-left"
              >
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  Parties terminées ({completedGames.length})
                  {showCompleted ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
      </div>

      {/* Bouton nouvelle partie ou continuer - fixe en bas */}
      <div className="fixed-bottom-button">
        <div className="max-w-2xl mx-auto">
          {activeGames.length > 0 ? (
            <Button
              type="button"
              size="lg"
              tabIndex={0}
              onClick={() => handlePlayGame(activeGames[0].id)}
              className="w-full rounded-full gap-2 h-14 text-lg font-semibold"
            >
              <Play className="w-6 h-6" />
              Continuer la partie
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              tabIndex={0}
              onClick={() => router.push('/new-game')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push('/new-game');
                }
              }}
              className="w-full rounded-full gap-2 h-14 text-lg font-semibold"
            >
              <Plus className="w-6 h-6" />
              Nouvelle partie
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
