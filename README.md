# Score Mate 🎮

Webapp mobile-first pour compter les points de Skyjo et Flip 7.

## 🎯 Fonctionnalités

- **Support de 2 jeux** : Skyjo et Flip 7
- **2 à 6 joueurs** par partie
- **Historique complet** : Visualisez toutes les manches jouées
- **Détection automatique du gagnant** selon les règles de chaque jeu
- **Persistance locale** : Les parties sont sauvegardées dans localStorage
- **Design mobile-first** : Interface optimisée pour mobile et tablette

## 🎲 Règles des jeux

### Skyjo
- **Objectif** : Avoir le score le **plus BAS**
- **Score cible** : 100 points (par défaut, personnalisable)
- **Fin de partie** : Quand un joueur atteint ou dépasse le score cible
- **Gagnant** : Le joueur avec le moins de points

### Flip 7
- **Objectif** : Avoir le score le **plus HAUT**
- **Score cible** : 200 points (par défaut, personnalisable)
- **Fin de partie** : Quand un joueur atteint ou dépasse le score cible
- **Gagnant** : Le joueur avec le plus de points

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🛠️ Stack technique

- **Next.js 14+** avec App Router
- **TypeScript** pour le typage
- **Tailwind CSS** pour le styling
- **shadcn/ui** pour les composants UI
- **localStorage** pour la persistance

## 📱 Utilisation

### 1. Créer une partie
- Cliquez sur "Nouvelle partie"
- Choisissez votre jeu (Skyjo ou Flip 7)
- Ajoutez 2 à 6 joueurs
- Optionnel : personnalisez le score cible
- Démarrez la partie

### 2. Jouer une manche
- Saisissez le score de chaque joueur pour la manche
- Cliquez sur "Valider la manche"
- Le tableau affiche l'historique complet et les totaux

### 3. Fin de partie
- L'application détecte automatiquement quand un joueur atteint le score cible
- Une modal affiche le gagnant et le classement final
- Vous pouvez revenir à l'accueil pour voir toutes vos parties

### 4. Reprendre ou supprimer une partie
- Les parties en cours sont listées sur l'accueil
- Cliquez sur "Continuer la partie" pour reprendre
- Cliquez sur l'icône poubelle pour supprimer une partie

## 📦 Structure du projet

```
score-mate/
├── app/
│   ├── page.tsx              # Page d'accueil avec liste des parties
│   ├── new-game/page.tsx     # Création de nouvelle partie
│   └── game/[id]/page.tsx    # Page de jeu avec tableau de scores
├── components/ui/            # Composants shadcn/ui
├── lib/
│   ├── storage.ts            # Gestion du localStorage
│   └── gameLogic.ts          # Logique métier des jeux
└── types/
    └── game.ts               # Types TypeScript
```

## 🔧 Build de production

```bash
# Créer un build de production
npm run build

# Lancer le serveur de production
npm start
```

## 💾 Persistance des données

Les parties sont sauvegardées automatiquement dans le localStorage de votre navigateur. Cela signifie :
- ✅ Vos parties persistent même si vous fermez l'onglet
- ✅ Pas besoin de connexion internet
- ✅ Aucune donnée n'est envoyée sur internet
- ⚠️ Si vous videz le cache du navigateur, les parties seront perdues

## 📄 License

Projet personnel - Libre d'utilisation
