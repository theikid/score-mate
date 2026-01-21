#!/bin/sh

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

printf "\n${BLUE}📦 Installation des git hooks ScoreMate${NC}\n\n"

# Créer le hook pre-push
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# Couleurs
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si c'est un push de tag
while read local_ref local_sha remote_ref remote_sha; do
  if [[ "$local_ref" =~ refs/tags/ ]]; then
    # Vérifier si la variable d'environnement RELEASE_SCRIPT est définie
    if [ -z "$RELEASE_SCRIPT" ]; then
      echo -e "\n${RED}❌ Erreur: Les tags doivent être créés via le script release.sh${NC}"
      echo -e "${YELLOW}⚠️  Utilisez: ./release.sh v1.x.x${NC}\n"
      exit 1
    fi
  fi

  # Vérifier si c'est un push vers main
  if [[ "$remote_ref" == "refs/heads/main" ]]; then
    # Vérifier si la variable d'environnement RELEASE_SCRIPT est définie
    if [ -z "$RELEASE_SCRIPT" ]; then
      echo -e "\n${RED}❌ Erreur: Les pushs vers main doivent passer par le script release.sh${NC}"
      echo -e "${YELLOW}⚠️  Utilisez: ./release.sh v1.x.x${NC}\n"
      exit 1
    fi
  fi
done

exit 0
EOF

chmod +x .git/hooks/pre-push

printf "${GREEN}✅ Git hooks installés avec succès!${NC}\n"
printf "${GREEN}   • pre-push: Force l'utilisation de release.sh pour les releases${NC}\n\n"
