'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameType } from '@/types/game';
import { createGame } from '@/lib/gameLogic';
import { saveGame } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Check, Users } from 'lucide-react';

const PRESET_PLAYERS = ['Max', 'Marlow', 'Joshua', 'Julia'];

export default function NewGame() {
  const router = useRouter();
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [customPlayerName, setCustomPlayerName] = useState('');
  const [customTargetScore, setCustomTargetScore] = useState<string>('');

  const getDefaultTargetScore = (type: GameType): number => {
    return type === 'skyjo' ? 100 : 200;
  };

  // Pré-remplir le score cible quand le type de jeu change
  useEffect(() => {
    if (gameType) {
      setCustomTargetScore(getDefaultTargetScore(gameType).toString());
    }
  }, [gameType]);

  const togglePresetPlayer = (name: string) => {
    if (selectedPlayers.includes(name)) {
      setSelectedPlayers(selectedPlayers.filter((p) => p !== name));
    } else {
      if (selectedPlayers.length < 6) {
        setSelectedPlayers([...selectedPlayers, name]);
      }
    }
  };

  const addCustomPlayer = () => {
    const trimmedName = customPlayerName.trim();
    if (trimmedName && !selectedPlayers.includes(trimmedName)) {
      if (selectedPlayers.length < 6) {
        setSelectedPlayers([...selectedPlayers, trimmedName]);
        setCustomPlayerName('');
      }
    }
  };

  const removePlayer = (name: string) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p !== name));
  };

  const handleStartGame = () => {
    if (!gameType) {
      alert('Veuillez sélectionner un type de jeu');
      return;
    }

    if (selectedPlayers.length < 2) {
      alert('Veuillez sélectionner au moins 2 joueurs');
      return;
    }

    const targetScore = customTargetScore
      ? parseInt(customTargetScore)
      : getDefaultTargetScore(gameType);

    if (isNaN(targetScore) || targetScore <= 0) {
      alert('Veuillez saisir un score cible valide');
      return;
    }

    const game = createGame(gameType, selectedPlayers, targetScore);
    saveGame(game);
    router.push(`/game/${game.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto p-4 pb-24 md:pb-4">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Nouvelle partie</h1>
          </div>

          {/* Sélection du type de jeu */}
          <Card>
            <CardHeader>
              <CardTitle>Type de jeu</CardTitle>
              <CardDescription>
                Choisissez le jeu que vous souhaitez jouer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => setGameType('skyjo')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  gameType === 'skyjo'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Skyjo</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Le score le plus bas gagne • Cible : 100 pts
                    </p>
                  </div>
                  {gameType === 'skyjo' && (
                    <Badge variant="default">Sélectionné</Badge>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setGameType('flip7')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  gameType === 'flip7'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Flip 7</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Le score le plus haut gagne • Cible : 200 pts
                    </p>
                  </div>
                  {gameType === 'flip7' && (
                    <Badge variant="default">Sélectionné</Badge>
                  )}
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Sélection rapide des joueurs */}
          {gameType && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Joueurs ({selectedPlayers.length}/6)
                  </div>
                </CardTitle>
                <CardDescription>
                  Sélectionnez rapidement les joueurs ou ajoutez un nom personnalisé
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Boutons joueurs prédéfinis */}
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_PLAYERS.map((name) => {
                    const isSelected = selectedPlayers.includes(name);
                    return (
                      <Button
                        key={name}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => togglePresetPlayer(name)}
                        className="h-12 relative"
                        disabled={!isSelected && selectedPlayers.length >= 6}
                      >
                        {isSelected && (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        {name}
                      </Button>
                    );
                  })}
                </div>

                {/* Ajout joueur personnalisé */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Ou ajoutez un autre joueur :
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nom du joueur"
                      value={customPlayerName}
                      onChange={(e) => setCustomPlayerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customPlayerName.trim() && selectedPlayers.length < 6) {
                          addCustomPlayer();
                        }
                      }}
                      disabled={selectedPlayers.length >= 6}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addCustomPlayer}
                      disabled={
                        !customPlayerName.trim() || selectedPlayers.length >= 6
                      }
                      className="gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </Button>
                  </div>
                </div>

                {/* Liste des joueurs sélectionnés */}
                {selectedPlayers.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium">Joueurs sélectionnés :</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlayers.map((name) => (
                        <Badge
                          key={name}
                          variant="secondary"
                          className="px-3 py-2 text-sm flex items-center gap-2"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => removePlayer(name)}
                            className="hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPlayers.length < 2 && (
                  <p className="text-sm text-muted-foreground italic">
                    Sélectionnez au moins 2 joueurs pour démarrer
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Score cible */}
          {gameType && (
            <Card>
              <CardHeader>
                <CardTitle>Score cible</CardTitle>
                <CardDescription>
                  Modifiez si vous souhaitez un score différent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  value={customTargetScore}
                  onChange={(e) => setCustomTargetScore(e.target.value)}
                  min="1"
                />
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* Bouton démarrer - fixe en bas sur mobile, normal sur desktop */}
      {gameType && (
        <div className="fixed-bottom-button">
          <div className="max-w-2xl mx-auto">
            <Button
              type="button"
              size="lg"
              onClick={handleStartGame}
              className="w-full rounded-full gap-1"
              disabled={selectedPlayers.length < 2}
            >
              Démarrer la partie
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
