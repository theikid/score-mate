#!/bin/bash
set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}🚀 Script de release ScoreMate${NC}\n"

# Vérifier qu'on est sur develop
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo -e "${RED}❌ Erreur: Vous devez être sur la branche 'develop' pour créer une release${NC}"
  echo -e "Branche actuelle: $CURRENT_BRANCH"
  exit 1
fi

# Vérifier qu'il n'y a pas de changements non commités
if ! git diff-index --quiet HEAD --; then
  echo -e "${RED}❌ Erreur: Il y a des changements non commités${NC}"
  echo -e "Commitez ou stash vos changements avant de créer une release"
  exit 1
fi

# Version depuis l'argument ou demande interactive
if [ -n "$1" ]; then
  VERSION="$1"
  echo -e "\n${BLUE}Version spécifiée: $VERSION${NC}"
else
  echo -e "\n${BLUE}Entrez la nouvelle version (ex: v1.0.0):${NC}"
  read -r VERSION
fi

# Vérifier que le tag n'existe pas déjà
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo -e "${RED}❌ Erreur: Le tag $VERSION existe déjà${NC}"
  exit 1
fi

echo -e "\n${BLUE}📦 Création de la release $VERSION${NC}\n"

# Mettre à jour depuis origin
echo -e "${BLUE}Récupération des dernières modifications...${NC}"
git fetch origin

# Merger develop dans main
echo -e "\n${BLUE}Merge de develop dans main...${NC}"
git checkout main
git pull origin main
git merge develop --no-ff -m "Merge develop into main for release $VERSION"

# Créer le tag
echo -e "\n${BLUE}Création du tag $VERSION...${NC}"
git tag -a "$VERSION" -m "Release $VERSION"

# Vérifier que Docker est en cours d'exécution
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}❌ Erreur: Docker n'est pas en cours d'exécution${NC}"
  exit 1
fi

# Vérifier la connexion à GHCR
echo -e "\n${BLUE}Vérification de la connexion à GHCR...${NC}"
if ! docker pull ghcr.io/theikid/score-mate:latest >/dev/null 2>&1; then
  echo -e "${RED}⚠️  Pas de connexion à GHCR ou image introuvable (normal pour la première release)${NC}"
fi

# Builder l'image avec buildx pour ARM64 (architecture de Lothal)
echo -e "\n${BLUE}🔨 Build de l'image Docker (ARM64)...${NC}"
echo -e "${BLUE}Image: ghcr.io/theikid/score-mate:$VERSION${NC}\n"

docker buildx build \
  --platform linux/arm64 \
  -t ghcr.io/theikid/score-mate:latest \
  -t ghcr.io/theikid/score-mate:"$VERSION" \
  --push \
  .

# Push vers GitHub
echo -e "\n${BLUE}📤 Push vers GitHub...${NC}"
git push origin main
git push origin "$VERSION"

# Retourner sur develop et sync
echo -e "\n${BLUE}Retour sur develop et synchronisation...${NC}"
git checkout develop
git merge main -m "Sync with main after release $VERSION"
git push origin develop

echo -e "\n${GREEN}✅ Release $VERSION créée avec succès!${NC}"
echo -e "${GREEN}   • Image: ghcr.io/theikid/score-mate:$VERSION${NC}"
echo -e "${GREEN}   • Image: ghcr.io/theikid/score-mate:latest${NC}"
echo -e "${GREEN}   • Tag Git: $VERSION${NC}"
echo -e "${GREEN}   • Le webhook GitHub déclenchera le déploiement automatiquement${NC}\n"
