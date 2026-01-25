'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { evaluateExpression } from '@/lib/calculator';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (result: number) => void;
  playerName?: string;
  initialValue?: string;
}

export function Calculator({ isOpen, onClose, onValidate, playerName, initialValue }: CalculatorProps) {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [previousExpression, setPreviousExpression] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Réinitialiser ou charger la valeur initiale lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (initialValue && initialValue !== '') {
        setExpression(initialValue);
        setDisplay(initialValue);
        setPreviousExpression('');
      } else {
        setExpression('');
        setDisplay('0');
        setPreviousExpression('');
      }
      setError(null);
    }
  }, [isOpen, initialValue]);

  const handleNumber = (num: string) => {
    setError(null);
    setPreviousExpression(''); // Effacer l'expression précédente lors d'une nouvelle saisie
    const newExpression = expression === '0' ? num : expression + num;
    setExpression(newExpression);
    setDisplay(newExpression);
  };

  const handleOperator = (op: string) => {
    setError(null);
    setPreviousExpression(''); // Effacer l'expression précédente lors d'une nouvelle opération
    if (expression === '') return;

    // Ne pas ajouter un opérateur si le dernier caractère est déjà un opérateur
    const lastChar = expression.slice(-1);
    if (['+', '-', '*', '×'].includes(lastChar)) {
      // Remplacer le dernier opérateur
      const newExpression = expression.slice(0, -1) + op;
      setExpression(newExpression);
      setDisplay(newExpression);
    } else {
      const newExpression = expression + op;
      setExpression(newExpression);
      setDisplay(newExpression);
    }
  };

  const handleClear = () => {
    setExpression('');
    setDisplay('0');
    setPreviousExpression('');
    setError(null);
  };

  const handleDelete = () => {
    setError(null);
    if (expression.length === 0) return;

    const newExpression = expression.slice(0, -1);
    setExpression(newExpression);
    setDisplay(newExpression || '0');
  };

  const handleEquals = () => {
    if (expression === '') return;

    const { result, error: evalError } = evaluateExpression(expression);

    if (evalError) {
      setError(evalError);
      return;
    }

    if (result !== null) {
      // Sauvegarder l'expression avant de la remplacer par le résultat
      setPreviousExpression(expression);
      setExpression(result.toString());
      setDisplay(result.toString());
      setError(null);
    }
  };

  const handleValidate = () => {
    if (expression === '') {
      setError('Veuillez entrer une expression');
      return;
    }

    const { result, error: evalError } = evaluateExpression(expression);

    if (evalError) {
      setError(evalError);
      return;
    }

    if (result !== null) {
      onValidate(result);
    }
  };

  const buttons = [
    // Ligne 1
    { value: '7', type: 'number' },
    { value: '8', type: 'number' },
    { value: '9', type: 'number' },
    { value: '×', type: 'operator' },

    // Ligne 2
    { value: '4', type: 'number' },
    { value: '5', type: 'number' },
    { value: '6', type: 'number' },
    { value: '-', type: 'operator' },

    // Ligne 3
    { value: '1', type: 'number' },
    { value: '2', type: 'number' },
    { value: '3', type: 'number' },
    { value: '+', type: 'operator' },

    // Ligne 4
    { value: 'C', type: 'clear' },
    { value: '0', type: 'number' },
    { value: '⌫', type: 'delete' },
    { value: '=', type: 'equals' },
  ];

  const getButtonVariant = (type: string) => {
    switch (type) {
      case 'clear':
        return 'destructive';
      case 'operator':
      case 'equals':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleButtonClick = (button: { value: string; type: string }) => {
    switch (button.type) {
      case 'number':
        handleNumber(button.value);
        break;
      case 'operator':
        handleOperator(button.value);
        break;
      case 'clear':
        handleClear();
        break;
      case 'delete':
        handleDelete();
        break;
      case 'equals':
        handleEquals();
        break;
    }
  };

  const getButtonAriaLabel = (button: { value: string; type: string }) => {
    switch (button.value) {
      case '×':
        return 'Multiplication';
      case '-':
        return 'Soustraction';
      case '+':
        return 'Addition';
      case '=':
        return 'Égal';
      case 'C':
        return 'Effacer tout';
      case '⌫':
        return 'Effacer';
      default:
        return button.value;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-background flex flex-col"
      style={{ height: '100dvh' }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Header */}
      <div className="px-4 safe-top-header pb-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex-shrink-0 w-10" />
        <h2 className="text-2xl font-bold flex-1 text-center">
          Calcul du score
        </h2>
        <div className="flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="rounded-full"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-4 max-w-md mx-auto w-full justify-center gap-6 pt-4 pb-8">
        {/* Display */}
        <div className="flex flex-col justify-end">
          <div className="text-right text-sm font-mono text-muted-foreground mb-1 break-all">
            {previousExpression || '\u00A0'}
          </div>
          <div
            className="text-right text-5xl font-mono font-bold break-all tracking-tight"
            aria-live="polite"
            aria-atomic="true"
            aria-describedby={error ? "calculator-error" : undefined}
          >
            {display}
          </div>
          <div id="calculator-error" className="text-destructive text-xs mt-1 text-right min-h-[16px]" role="alert" aria-live="assertive">
            {error && <span className="animate-in fade-in">{error}</span>}
          </div>
        </div>

        {/* Grid de boutons */}
        <div className="grid grid-cols-4 gap-3">
          {buttons.map((button, index) => {
            const isNumber = button.type === 'number';
            const isOperator = button.type === 'operator';
            const isEquals = button.type === 'equals';
            const isClear = button.type === 'clear';

            return (
              <Button
                key={index}
                type="button"
                variant={getButtonVariant(button.type)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleButtonClick(button);
                }}
                aria-label={getButtonAriaLabel(button)}
                className={`h-[72px] w-full rounded-full text-3xl font-semibold transition-all active:scale-90 shadow-md ${
                  isNumber ? 'bg-card hover:bg-accent' : ''
                } ${
                  isOperator ? 'bg-secondary hover:bg-secondary/80' : ''
                } ${
                  isEquals ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg' : ''
                } ${
                  isClear ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''
                }`}
              >
                {button.value}
              </Button>
            );
          })}
        </div>

        {/* Bouton Valider */}
        <Button
          type="button"
          size="lg"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleValidate();
          }}
          className="w-full h-14 text-xl font-semibold rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg mt-2"
        >
          Valider
        </Button>
      </div>
    </div>
  );
}
