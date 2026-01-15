'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Game } from '@/types/game';
import { getActiveGames, getCompletedGames, deleteGame } from '@/lib/storage';
import { getGameName, calculateTotals } from '@/lib/gameLogic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Trash2, Trophy } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [completedGames, setCompletedGames] = useState<Game[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    loadGames();
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

    return (
      <Card key={game.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {getGameName(game.type)}
                {game.status === 'completed' && (
                  <Badge variant="secondary" className="ml-2">
                    <Trophy className="w-3 h-3 mr-1" />
                    Terminée
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {playerNames}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              tabIndex={0}
              onClick={() => handleDeleteGame(game.id)}
              className="text-destructive hover:text-destructive rounded-full"
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
            {game.status === 'in-progress' && (
              <Button
                tabIndex={0}
                onClick={() => handlePlayGame(game.id)}
                className="w-full mt-4"
              >
                <Play className="w-4 h-4 mr-2" />
                Continuer la partie
              </Button>
            )}
            {game.status === 'completed' && game.winner && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-center">
                  🏆{' '}
                  <span className="font-semibold">
                    {game.players.find((p) => p.id === game.winner)?.name}
                  </span>{' '}
                  a gagné !
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto p-4 pb-32 md:pb-4">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="text-center pt-8 pb-4">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Score Mate
            </h1>
            <p className="text-muted-foreground">
              Compteur de points pour Skyjo et Flip 7
            </p>
          </div>

          {/* Parties en cours */}
          {activeGames.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Parties en cours</h2>
              <div className="space-y-3">
                {activeGames.map(renderGameCard)}
              </div>
            </div>
          )}

          {/* Message quand aucune partie */}
          {activeGames.length === 0 && completedGames.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p className="text-lg mb-2">Aucune partie en cours</p>
                <p className="text-sm">
                  Créez une nouvelle partie pour commencer !
                </p>
              </CardContent>
            </Card>
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
                  <span className="text-muted-foreground text-sm">
                    {showCompleted ? '▼' : '▶'}
                  </span>
                </h2>
              </button>
              {showCompleted && (
                <div className="space-y-3">
                  {completedGames.map(renderGameCard)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bouton nouvelle partie - fixe en bas sur mobile, normal sur desktop */}
      <div className="fixed-bottom-button">
        <div className="max-w-2xl mx-auto">
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
            className="w-full rounded-full gap-1.5"
          >
            <Plus className="w-5 h-5" />
            Nouvelle partie
          </Button>
        </div>
      </div>
    </div>
  );
}
