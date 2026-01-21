export const evaluateExpression = (
  expr: string
): { result: number | null; error: string | null } => {
  try {
    // Normaliser l'expression
    let normalized = expr
      .replace(/×/g, '*')  // Remplacer × par *
      .replace(/\s+/g, ''); // Supprimer les espaces

    // Validation : caractères autorisés uniquement
    const allowedChars = /^[0-9+\-*().]+$/;
    if (!normalized || !allowedChars.test(normalized)) {
      return {
        result: null,
        error: 'Expression invalide. Utilisez uniquement des chiffres et les opérateurs +, -, ×',
      };
    }

    // Vérifier les parenthèses balancées
    let parenthesesCount = 0;
    for (const char of normalized) {
      if (char === '(') parenthesesCount++;
      if (char === ')') parenthesesCount--;
      if (parenthesesCount < 0) {
        return {
          result: null,
          error: 'Parenthèses mal balancées',
        };
      }
    }
    if (parenthesesCount !== 0) {
      return {
        result: null,
        error: 'Parenthèses mal balancées',
      };
    }

    // Évaluer l'expression en utilisant Function constructor
    // Utilisation de Function au lieu d'eval pour plus de sécurité
    const evalFunc = new Function('return (' + normalized + ')');
    const result = evalFunc();

    // Vérifier que le résultat est un nombre valide
    if (typeof result !== 'number' || !isFinite(result)) {
      return {
        result: null,
        error: 'Résultat invalide',
      };
    }

    // Arrondir le résultat à l'entier (scores de jeux)
    const roundedResult = Math.round(result);

    return {
      result: roundedResult,
      error: null,
    };
  } catch (error) {
    return {
      result: null,
      error: 'Erreur de calcul. Vérifiez votre expression.',
    };
  }
};
