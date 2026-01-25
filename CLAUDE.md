# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Score Mate est une webapp mobile-first pour compter les points de jeux de société (Skyjo et Flip 7). Construit avec Next.js 16 App Router, stockage localStorage, et déployé sur Hetzner VPS (Lothal) avec Dockhand.

**Live URL**: https://scoremate.maximeealet.com

## IMPORTANT: Release Process

**🚨 CRITICAL: When creating a new release or version tag, ALWAYS use the `release.sh` script.**

**Never manually tag or push to main without using the script.**

The automated release script (`release.sh`) handles:
1. Merging `develop` into `main`
2. Creating version tags
3. Updating `package.json` version
4. Building Docker images locally on Mac M1 (ARM64 native)
5. Pushing images to GitHub Container Registry (GHCR)
6. Pushing changes to GitHub

**Usage:**
```bash
# From the develop branch
./release.sh patch   # 2.0.0 → 2.0.1
./release.sh minor   # 2.0.0 → 2.1.0
./release.sh major   # 2.0.0 → 3.0.0
./release.sh v2.1.0  # Version spécifique
```

**Before running the script:**
- Ensure Docker is logged into GHCR: `docker login ghcr.io -u theikid`
- Ensure you're on the `develop` branch
- Ensure all changes are committed

**Release Message Generation:**
When the user asks Claude to create a release (especially minor/major releases), Claude should:
1. Analyze the git commit history since the last release
2. Review the user's recent requests and context from the conversation
3. Generate a concise, descriptive release message that summarizes the changes
4. Provide this message directly to the `release.sh` script when prompted

Example: If asked "fais une release minor", Claude should examine commits, identify key features/fixes, and suggest something like "feat: Add PWA auto-update support and improve mobile UX" instead of using the default "Release vX.Y.Z".

See `DEPLOYMENT.md` for detailed documentation.

**Why local builds?** Mac M1 is ARM64 native, which matches the Lothal VPS architecture. Local builds are faster (~2-3 min) and more reliable than GitHub Actions with QEMU emulation (~6-10 min, potential failures).

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **State Management**: localStorage (client-side only)
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Deployment**: Hetzner VPS + Dockhand (Docker orchestration)
- **Reverse Proxy**: Traefik v3.6
- **SSO**: Deflector via Traefik ForwardAuth

## Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Icons generation
npm run generate:icons   # Generate PWA icons from SVG source
```

## Architecture & Patterns

### Game Logic

**Supported Games:**
1. **Skyjo** - Objectif: score le plus BAS, cible par défaut: 100 points
2. **Flip 7** - Objectif: score le plus HAUT, cible par défaut: 200 points

**Game State Structure:**
```typescript
type Game = {
  id: string
  name: string // "Skyjo" ou "Flip 7"
  players: Player[]
  rounds: Round[]
  targetScore: number
  createdAt: Date
  winner?: string
}
```

**Key Patterns:**
- 2 to 6 players per game
- Each round stores individual scores for all players
- Game end detection is automatic when a player reaches/exceeds target score
- Winner determination depends on game type (lowest for Skyjo, highest for Flip 7)

### Data Persistence

**localStorage-based architecture:**
- All game data is stored client-side in browser localStorage
- No database, no server-side state
- Storage key: `score-mate-games`
- Automatic save after each action
- Data format: JSON array of Game objects

**Storage Functions** (`src/lib/storage.ts`):
```typescript
loadGames(): Game[]           // Load all games from localStorage
saveGames(games: Game[]): void // Save games to localStorage
getGame(id: string): Game     // Get specific game by ID
createGame(game: Game): void  // Create new game
updateGame(game: Game): void  // Update existing game
deleteGame(id: string): void  // Delete game
```

**Important Notes:**
- Data persists across browser sessions
- Clearing browser cache deletes all games
- No data is sent to server (100% client-side)
- No authentication needed (localStorage is per-device)

### Component Patterns

**Client Components**: All components are client components (`"use client"`) because of localStorage usage.

**UI Components**: Uses shadcn/ui components in `src/components/ui/`. These are customized Radix UI primitives with Tailwind styling.

**State Management Pattern:**
```typescript
// Load from localStorage on mount
const [games, setGames] = useState<Game[]>([])

useEffect(() => {
  setGames(loadGames())
}, [])

// Save to localStorage after state update
const addRound = (roundScores: number[]) => {
  const updatedGame = { ...game, rounds: [...game.rounds, newRound] }
  updateGame(updatedGame)
  setGame(updatedGame)
}
```

### Routing Structure

```
app/
├── page.tsx              # Home: list of all games
├── new-game/page.tsx     # Game creation form
└── game/[id]/page.tsx    # Active game with score table
```

**Navigation Flow:**
1. Home (`/`) - View all games (in progress + completed)
2. New Game (`/new-game`) - Create game (select type, players, target score)
3. Game Page (`/game/[id]`) - Play rounds, view history, detect winner

### Styling

**Tailwind Configuration**:
- Tailwind CSS v4 with new `@import` syntax
- Custom theme via CSS variables in `src/app/globals.css`
- Mobile-first responsive design

**Design System**: Uses HSL CSS variables for theming (border, background, foreground, primary, secondary, etc.).

**Font**: Geist Sans via `next/font/geist`.

**Responsive**: Optimized for mobile devices with tablet/desktop support.

## Environment Variables

No environment variables required (client-side only app).

Optional for deployment:
```env
NODE_ENV=production
PORT=3000
```

## Deployment

**Platform**: Deployed on Hetzner VPS (Lothal) using Dockhand for deployment management.

**Architecture**:
- Docker containers orchestrated with docker-compose
- Traefik v3.6 as reverse proxy
- Deflector SSO via Traefik ForwardAuth middleware
- Images stored in GitHub Container Registry (GHCR)

**Build Process**:
1. Local build on Mac M1 (ARM64 native) via `release.sh`
2. Image pushed to `ghcr.io/theikid/score-mate:latest` and `ghcr.io/theikid/score-mate:vX.Y.Z`
3. Deployed via Dockhand on Lothal VPS

**Network**: Uses `purrgil` network for inter-container communication with Deflector SSO.

**SSL**: Let's Encrypt certificates managed by Traefik with automatic renewal.

**Deployment URL**: https://dockhand.maximeealet.com

See `DEPLOYMENT.md` for the full release and deployment process.

## Common Gotchas

1. **Client-side only**: All code runs in browser, no server-side logic beyond Next.js serving static files
2. **localStorage limitations**: 5-10MB storage limit, data lost on cache clear
3. **No authentication**: Deflector SSO protects the app but no user data in localStorage
4. **Mobile-first**: Design and test on mobile viewports first
5. **Next.js 16 specifics**: Uses latest App Router patterns and React 19 features

## File Structure

```
score-mate/
├── src/
│   ├── app/
│   │   ├── page.tsx                # Home page
│   │   ├── new-game/page.tsx       # Game creation
│   │   ├── game/[id]/page.tsx      # Game view
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles & CSS variables
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── GameCard.tsx            # Game list card
│   │   ├── PlayerScoreInput.tsx    # Score input for rounds
│   │   └── WinnerDialog.tsx        # Winner announcement modal
│   ├── lib/
│   │   ├── storage.ts              # localStorage utilities
│   │   ├── gameLogic.ts            # Game rules & winner detection
│   │   └── utils.ts                # General utilities
│   └── types/
│       └── game.ts                 # TypeScript types
├── public/
│   ├── icon.svg                    # App icon source
│   └── manifest.json               # PWA manifest
├── scripts/
│   ├── generate-icons.js           # Icon generation script
│   └── install-hooks.sh            # Git hooks installer
├── Dockerfile                      # Docker build config
├── compose.yaml                    # Docker Compose config
├── release.sh                      # Release script
├── DEPLOYMENT.md                   # Deployment documentation
└── CLAUDE.md                       # This file
```

## Development Workflow

### Adding a new game type

1. Add game definition in `src/lib/gameLogic.ts`
2. Update `Game` type in `src/types/game.ts`
3. Add game selection option in `src/app/new-game/page.tsx`
4. Update winner detection logic in `src/lib/gameLogic.ts`

### Modifying score calculation

All game logic is centralized in `src/lib/gameLogic.ts`:
- `calculateTotalScore(rounds, playerIndex)` - Calculate cumulative score
- `checkWinCondition(game)` - Detect if game should end
- `determineWinner(game)` - Determine winner based on game type

### UI Customization

Colors and theming are defined in `src/app/globals.css` using CSS variables. Modify these to change the app's appearance globally.

## Additional Documentation

- `README.md` - Project setup and overview
- `DEPLOYMENT.md` - Deployment guide (Docker, Traefik, Dockhand)
- `package.json` - Dependencies and scripts
