'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GameType } from '@/types/game';
import { createGame } from '@/lib/gameLogic';
import { saveGame, getActiveGames } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Check, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const PRESET_PLAYERS = ['Max', 'Marlow', 'Joshua', 'Julia'];

export default function NewGame() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [customPlayerName, setCustomPlayerName] = useState('');
  const [customTargetScore, setCustomTargetScore] = useState<string>('');
  const firstPlayerButtonRef = useRef<HTMLButtonElement>(null);

  const getDefaultTargetScore = (type: GameType): number => {
    return type === 'skyjo' ? 100 : 200;
  };

  // Rediriger vers la partie en cours s'il y en a une
  useEffect(() => {
    const activeGames = getActiveGames();
    if (activeGames.length > 0) {
      router.push(`/game/${activeGames[0].id}`);
    }
  }, [router]);

  // Pré-remplir le score cible quand le type de jeu change
  useEffect(() => {
    if (gameType && customTargetScore === '') {
      setCustomTargetScore(getDefaultTargetScore(gameType).toString());
    }
  }, [gameType, customTargetScore]);

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

  const handleNext = () => {
    if (step === 1 && !gameType) {
      alert('Veuillez sélectionner un type de jeu');
      return;
    }
    if (step === 2 && selectedPlayers.length < 2) {
      alert('Veuillez sélectionner au moins 2 joueurs');
      return;
    }
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
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

  const steps = [
    { number: 1, label: 'Type de jeu' },
    { number: 2, label: 'Joueurs' },
    { number: 3, label: 'Score cible' },
  ];

  return (
    <div className="bg-background overflow-hidden flex flex-col" style={{ height: '100dvh' }}>
      {/* Lien d'évitement */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Aller au contenu principal
      </a>

      <div className="container max-w-2xl mx-auto px-4 pb-24 md:pb-4 flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="flex items-center gap-3 safe-top pt-8 pb-10 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="rounded-full"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft className="h-6 w-6" aria-hidden="true" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold">Nouvelle partie</h1>
          </div>
          <ThemeToggle />
        </header>

        {/* Container pour stepper + card */}
        <main id="main-content" className="flex-1 flex flex-col gap-10 pb-6">
          {/* Stepper */}
          <div className="flex items-start">
            {steps.map((s, index) => (
              <React.Fragment key={s.number}>
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step === s.number
                        ? 'bg-primary text-primary-foreground'
                        : step > s.number
                        ? 'border-2 border-primary text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {s.number}
                  </div>
                  <span
                    className={`text-xs text-center ${
                      step === s.number ? 'font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex items-center flex-1 pt-5">
                    <div
                      className={`flex-1 h-0.5 mx-1 transition-all ${
                        step > s.number ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Étape 1 : Type de jeu */}
          {step === 1 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Type de jeu</CardTitle>
                <CardDescription>
                  Choisissez le jeu que vous souhaitez jouer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setGameType('skyjo');
                    setStep(2);
                  }}
                  className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/50 active:bg-primary/10 transition-all text-left"
                >
                  <div>
                    <h3 className="font-semibold text-lg">Skyjo</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Le score le plus bas gagne
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Cible : 100 pts
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGameType('flip7');
                    setStep(2);
                  }}
                  className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/50 active:bg-primary/10 transition-all text-left"
                >
                  <div>
                    <h3 className="font-semibold text-lg">Flip 7</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Le score le plus haut gagne
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Cible : 200 pts
                    </p>
                  </div>
                </button>
              </CardContent>
            </Card>
          )}

          {/* Étape 2 : Joueurs */}
          {step === 2 && (
            <Card className="border-border/50">
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
                  {PRESET_PLAYERS.map((name, index) => {
                    const isSelected = selectedPlayers.includes(name);
                    return (
                      <Button
                        key={name}
                        ref={index === 0 ? firstPlayerButtonRef : null}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => togglePresetPlayer(name)}
                        className="h-12 relative focus-visible:ring-4 focus-visible:ring-primary/30"
                        disabled={!isSelected && selectedPlayers.length >= 6}
                        aria-pressed={isSelected}
                      >
                        {isSelected && (
                          <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                        )}
                        {name}
                      </Button>
                    );
                  })}
                </div>

                {/* Ajout joueur personnalisé */}
                <div className="space-y-2">
                  <label htmlFor="custom-player-name" className="text-sm text-muted-foreground">
                    Ou ajoutez un autre joueur :
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-player-name"
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
                      <Plus className="w-4 h-4" aria-hidden="true" />
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
                        <button
                          key={name}
                          type="button"
                          onClick={() => removePlayer(name)}
                          className="px-3 py-2 text-sm flex items-center gap-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 transition-all"
                          aria-label={`Retirer ${name}`}
                        >
                          {name}
                          <Trash2 className="w-3 h-3" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPlayers.length < 2 && (
                  <p className="text-sm text-muted-foreground italic">
                    Sélectionnez au moins 2 joueurs pour continuer
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Étape 3 : Score cible */}
          {step === 3 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Score cible</CardTitle>
                <CardDescription>
                  Score par défaut : {gameType === 'skyjo' ? '100' : '200'} points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label htmlFor="target-score" className="sr-only">
                  Score cible
                </label>
                <Input
                  id="target-score"
                  type="number"
                  value={customTargetScore}
                  onChange={(e) => setCustomTargetScore(e.target.value)}
                  min="1"
                  className="text-lg"
                  aria-label="Score cible"
                />
              </CardContent>
            </Card>
          )}

        </main>
      </div>

      {/* Boutons navigation */}
      {step > 1 && (
        <footer className="fixed-bottom-button">
          <div className="w-full md:max-w-2xl mx-auto">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handlePrevious}
                className="rounded-full gap-2 h-14 text-lg font-semibold"
              >
                <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                Précédent
              </Button>
              {step === 2 && (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleNext}
                  className="flex-1 rounded-full gap-2 h-14 text-lg font-semibold"
                  disabled={selectedPlayers.length < 2}
                >
                  Suivant
                  <ChevronRight className="w-6 h-6" aria-hidden="true" />
                </Button>
              )}
              {step === 3 && (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleStartGame}
                  className="flex-1 rounded-full gap-2 h-14 text-lg font-semibold"
                >
                  Démarrer la partie
                </Button>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
