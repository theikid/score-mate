#!/bin/bash
set -e

# Définir la variable pour bypasser le hook pre-push
export RELEASE_SCRIPT=1

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ScoreMate Release Script ===${NC}"

# Vérifier qu'on est sur la branche develop
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo -e "${RED}Erreur: Ce script doit être exécuté depuis la branche develop${NC}"
  echo "Branche actuelle: $CURRENT_BRANCH"
  exit 1
fi

# Vérifier qu'il n'y a pas de changements non commités
if ! git diff-index --quiet HEAD --; then
  echo -e "${RED}Erreur: Il y a des changements non commités${NC}"
  git status --short
  exit 1
fi

# Lire la version actuelle depuis package.json
CURRENT_VERSION=$(node -e "console.log(require('./package.json').version)")
echo -e "\n${BLUE}Version actuelle: v$CURRENT_VERSION${NC}"

# Version depuis l'argument
if [ -n "$1" ]; then
  case "$1" in
    patch|minor|major)
      # Auto-incrément selon le type
      IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
      MAJOR="${VERSION_PARTS[0]}"
      MINOR="${VERSION_PARTS[1]}"
      PATCH="${VERSION_PARTS[2]}"

      case "$1" in
        major)
          MAJOR=$((MAJOR + 1))
          MINOR=0
          PATCH=0
          ;;
        minor)
          MINOR=$((MINOR + 1))
          PATCH=0
          ;;
        patch)
          PATCH=$((PATCH + 1))
          ;;
      esac

      NEW_VERSION="$MAJOR.$MINOR.$PATCH"
      VERSION="v$NEW_VERSION"
      echo -e "${BLUE}Type: $1 → Nouvelle version: $VERSION${NC}"
      ;;
    v*)
      # Version spécifiée directement
      VERSION="$1"
      NEW_VERSION="${VERSION#v}"
      echo -e "${BLUE}Version spécifiée: $VERSION${NC}"
      ;;
    *)
      echo -e "${RED}Erreur: Argument invalide. Utilisez 'patch', 'minor', 'major' ou 'vX.Y.Z'${NC}"
      exit 1
      ;;
  esac
else
  echo -e "\n${BLUE}Type de release (patch/minor/major) ou version (ex: v2.0):${NC}"
  read -r INPUT

  case "$INPUT" in
    patch|minor|major)
      IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
      MAJOR="${VERSION_PARTS[0]}"
      MINOR="${VERSION_PARTS[1]}"
      PATCH="${VERSION_PARTS[2]}"

      case "$INPUT" in
        major)
          MAJOR=$((MAJOR + 1))
          MINOR=0
          PATCH=0
          ;;
        minor)
          MINOR=$((MINOR + 1))
          PATCH=0
          ;;
        patch)
          PATCH=$((PATCH + 1))
          ;;
      esac

      NEW_VERSION="$MAJOR.$MINOR.$PATCH"
      VERSION="v$NEW_VERSION"
      ;;
    *)
      VERSION="$INPUT"
      NEW_VERSION="${VERSION#v}"
      ;;
  esac
fi

# Valider le format de version
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Erreur: Format de version invalide. Utilisez patch/minor/major ou v2.0.1${NC}"
  exit 1
fi

# Vérifier que le tag n'existe pas déjà
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo -e "${RED}Erreur: Le tag $VERSION existe déjà${NC}"
  exit 1
fi

echo -e "\n${GREEN}✓ Validation OK${NC}"
echo -e "${BLUE}Version: $VERSION${NC}"

# Demander un message de release
echo -e "\n${BLUE}Message de release (description des changements):${NC}"
echo -e "${BLUE}(Appuyez sur Entrée pour un message par défaut)${NC}"
read -r RELEASE_MESSAGE

if [ -z "$RELEASE_MESSAGE" ]; then
  RELEASE_MESSAGE="Release $VERSION"
fi

# Demander confirmation
echo -e "\n${BLUE}Actions à effectuer:${NC}"
echo "1. Mettre à jour package.json avec la version $NEW_VERSION"
echo "2. Merger develop dans main"
echo "3. Mettre à jour compose.yaml avec la version Docker"
echo "4. Créer le tag $VERSION sur main avec message: \"$RELEASE_MESSAGE\""
echo "5. Builder l'image Docker ARM64"
echo "6. Pusher l'image vers ghcr.io/theikid/score-mate:latest et :$VERSION"
echo "7. Pusher main et le tag vers GitHub"
echo "8. Pusher develop vers GitHub"
echo "9. Créer une GitHub Release (si gh CLI disponible)"
echo ""
echo -e "${BLUE}Continuer? (y/n)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo -e "${RED}Annulé${NC}"
  exit 0
fi

# Étape 0: Mettre à jour package.json sur develop
echo -e "\n${BLUE}[1/8] Mise à jour de package.json et package-lock.json sur develop...${NC}"
npm version "$NEW_VERSION" --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: Bump version to $NEW_VERSION"

# Étape 1: Merger develop dans main
echo -e "\n${BLUE}[2/8] Checkout main...${NC}"
git checkout main

echo -e "${BLUE}[3/8] Pull latest main...${NC}"
git pull origin main

echo -e "${BLUE}[4/8] Merge develop dans main...${NC}"
git merge develop --no-ff -m "Merge develop into main for release $VERSION"

# Étape 2: Mettre à jour la version dans compose.yaml
echo -e "\n${BLUE}[5/8] Mise à jour de la version dans compose.yaml...${NC}"
sed -i.bak "s|image: ghcr.io/theikid/score-mate:v.*|image: ghcr.io/theikid/score-mate:$VERSION|" compose.yaml
sed -i.bak "s|image: ghcr.io/theikid/score-mate:latest|image: ghcr.io/theikid/score-mate:$VERSION|" compose.yaml
rm -f compose.yaml.bak
git add compose.yaml
git commit -m "chore: Update Docker image version to $VERSION in compose.yaml" || echo "No changes to commit"

# Étape 3: Créer le tag
echo -e "\n${BLUE}[5/9] Création du tag $VERSION...${NC}"
git tag -a "$VERSION" -m "$RELEASE_MESSAGE"

# Étape 4: Builder et pusher l'image Docker
echo -e "\n${BLUE}[6/9] Build et push de l'image Docker...${NC}"
echo -e "${BLUE}Registry: ghcr.io/theikid/score-mate${NC}"
echo -e "${BLUE}Note: Assurez-vous d'être connecté à GHCR: docker login ghcr.io -u theikid${NC}"

# Builder l'image avec buildx pour ARM64
echo -e "${BLUE}Building ARM64 image...${NC}"
docker buildx build \
  --platform linux/arm64 \
  --build-arg VERSION="$VERSION" \
  -t ghcr.io/theikid/score-mate:latest \
  -t ghcr.io/theikid/score-mate:"$VERSION" \
  --push \
  .

# Étape 5: Push main et tags
echo -e "\n${BLUE}[7/9] Push main et tags vers GitHub...${NC}"
git push origin main
git push origin "$VERSION"

# Retour sur develop et push
echo -e "\n${BLUE}[8/9] Retour sur develop et synchronisation...${NC}"
git checkout develop
git push origin develop

# Étape 6: Créer une GitHub Release (si gh CLI est disponible)
echo -e "\n${BLUE}[9/9] Création de la GitHub Release...${NC}"
if command -v gh &> /dev/null; then
  echo -e "${BLUE}Création de la release sur GitHub...${NC}"
  gh release create "$VERSION" \
    --title "$RELEASE_MESSAGE" \
    --notes "$RELEASE_MESSAGE" \
    --target main
  echo -e "${GREEN}✓ GitHub Release créée: https://github.com/theikid/score-mate/releases/tag/$VERSION${NC}"
else
  echo -e "${BLUE}gh CLI non disponible, GitHub Release non créée${NC}"
  echo -e "${BLUE}Vous pouvez la créer manuellement: https://github.com/theikid/score-mate/releases/new?tag=$VERSION${NC}"
fi

echo -e "\n${GREEN}✓ Release $VERSION terminée avec succès!${NC}"
echo -e "${BLUE}Image Docker:${NC}"
echo "  - ghcr.io/theikid/score-mate:latest"
echo "  - ghcr.io/theikid/score-mate:$VERSION"
echo ""
echo -e "${BLUE}Prochaines étapes:${NC}"
echo "1. Déployer via Dockhand sur Lothal"
echo "2. Vérifier que l'application fonctionne"
