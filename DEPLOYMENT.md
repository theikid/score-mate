# Workflow de Déploiement Standard - Lothal

Ce document décrit le workflow de déploiement standardisé pour tous les projets déployés sur le VPS Lothal via Dockhand.

## Architecture

- **VPS**: Lothal (Hetzner, ARM64)
- **Orchestration**: Dockhand (déployé sur NAS Scarif, contrôle Lothal via Hawser)
- **Registry**: GitHub Container Registry (GHCR) - `ghcr.io/theikid/*`
- **Reverse Proxy**: Traefik v3.6
- **SSO**: Deflector via Traefik ForwardAuth
- **CI/CD**: Build local (Mac M1 ARM64) + Webhook GitHub → Dockhand

## Projets Concernés

| Projet | Image GHCR | URL Production |
|--------|------------|----------------|
| MyMusic Library | `ghcr.io/theikid/my-music-library` | https://mymusic.maximeealet.com |
| ScoreMate | `ghcr.io/theikid/score-mate` | https://scoremate.maximeealet.com |
| Deflector (SSO) | `ghcr.io/theikid/deflector:lothal` | https://deflector.maximeealet.com |
| Expenses | `ghcr.io/theikid/expense-tracker` | https://expenses.maximeealet.com |

## Workflow de Release

### 1. Modèle Git Branching

Tous les projets suivent le modèle **Git Flow simplifié** :

```
develop (branche de développement)
  ↓
main (branche de production, protégée)
  ↓
Tags versionnés (v1.0.0, v2.0.1, etc.)
```

**Règles** :
- ✅ Développement sur `develop`
- ✅ Release via merge `develop` → `main` + tag
- ✅ Uniquement via script `release.sh` (jamais manuellement)
- ❌ Pas de commit direct sur `main`
- ❌ Pas de push force

### 2. Script de Release

Chaque projet contient un script `release.sh` qui automatise :

1. Vérification de la branche (`develop`)
2. Merge `develop` → `main`
3. Création du tag version
4. **Build Docker local** (ARM64 sur Mac M1)
5. Push de l'image vers GHCR avec 2 tags :
   - `latest` (toujours la dernière version)
   - `vX.Y.Z` (version spécifique)
6. Push Git (main + tag)
7. Retour sur `develop` et sync

**Usage** :
```bash
# Sur la branche develop, avec tous les changements commités
./release.sh v1.2.0
```

### 3. Build Local vs GitHub Actions

**Pourquoi build local ?**
- ✅ **Rapide** : 2-3 min (vs 6-10 min avec GitHub Actions + QEMU)
- ✅ **Fiable** : ARM64 natif sur Mac M1 = architecture de Lothal
- ✅ **Pas d'échec d'émulation** : Pas de problèmes QEMU
- ❌ Nécessite Docker + connexion GHCR locale

**Configuration requise** :
```bash
# Une seule fois : login GHCR
docker login ghcr.io -u theikid
# Token avec permission write:packages
```

### 4. Déploiement Automatique

**Flow complet** :
```
Developer (Mac M1)
  ↓ ./release.sh v1.2.0
Local Docker Build (ARM64)
  ↓ push
GitHub Container Registry (GHCR)
  ↓ push tag
GitHub Repository
  ↓ webhook
Tailscale Funnel (truenas-holonet.tailcc5936.ts.net)
  ↓
Dockhand (sur Scarif)
  ↓ pull image + redeploy via Hawser
Lothal VPS
  ↓
Production 🎉
```

**Webhooks GitHub** :
- URL : `https://truenas-holonet.tailcc5936.ts.net/api/git/stacks/{STACK_ID}/webhook`
- Events : `push`, `create` (tags)
- Content-type : `application/json`

## Structure de Projet Standard

Chaque projet doit contenir :

```
project/
├── .github/
│   └── (pas de workflows - builds locaux)
├── src/
├── public/
├── Dockerfile              # Multi-stage avec standalone output
├── compose.yaml            # Docker Compose v2 (pas docker-compose.yml)
├── .dockerignore
├── .env.example
├── package.json
├── next.config.js/ts       # avec output: 'standalone'
├── release.sh              # Script de release standardisé
├── README.md
├── DEPLOYMENT.md           # Ce fichier (copié dans chaque projet)
└── CLAUDE.md               # Instructions pour Claude Code
```

## Configuration Docker

### Dockerfile Standard (Next.js)

```dockerfile
FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true  # Si nécessaire pour build sans DB
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

### compose.yaml Standard

```yaml
services:
  app:
    image: ghcr.io/theikid/PROJECT_NAME:latest
    container_name: PROJECT_NAME
    restart: unless-stopped
    expose:
      - "3000"
    networks:
      - purrgil
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=${PORT:-3000}
      # ... autres variables d'environnement
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      # Traefik
      - "traefik.enable=true"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"

      # HTTP (redirect vers HTTPS)
      - "traefik.http.routers.PROJECT-http.entrypoints=http"
      - "traefik.http.routers.PROJECT-http.rule=Host(`PROJECT.maximeealet.com`)"
      - "traefik.http.routers.PROJECT-http.middlewares=redirect-to-https"

      # HTTPS
      - "traefik.http.routers.PROJECT-https.entrypoints=https"
      - "traefik.http.routers.PROJECT-https.rule=Host(`PROJECT.maximeealet.com`)"
      - "traefik.http.routers.PROJECT-https.tls=true"
      - "traefik.http.routers.PROJECT-https.tls.certresolver=letsencrypt"
      - "traefik.http.routers.PROJECT-https.middlewares=sso-auth,gzip"

      # Service
      - "traefik.http.services.PROJECT.loadbalancer.server.port=3000"

networks:
  purrgil:
    external: true
```

## Configuration Dockhand

### Création de Stack

1. **Settings → Git → Repositories** : Ajouter le repo
2. **Stacks → Create → From Git** :
   - Repository : `theikid/PROJECT_NAME`
   - Branch : `main`
   - Compose file path : `./compose.yaml` ⚠️ (pas `./docker-compose.yml`)
   - Environment variables : Fichier `.env` ou via interface

### Webhook Configuration

Copier l'URL webhook fournie par Dockhand :
- Format interne : `https://holocron.scarif.maximeealet.com/api/git/stacks/{ID}/webhook`
- Format public (Funnel) : `https://truenas-holonet.tailcc5936.ts.net/api/git/stacks/{ID}/webhook`

Configurer dans GitHub → Settings → Webhooks :
- Payload URL : URL Funnel
- Content type : `application/json`
- Events : `push`, `create`

## Authentication & Registry

### Docker sur Lothal

**Une seule fois par serveur** :
```bash
ssh lothal
sudo docker login ghcr.io -u theikid
# Token avec permission read:packages
```

### Dockhand Registry

**Settings → Registries** :
- Name : `Github`
- URL : `https://ghcr.io`
- Username : `theikid`
- Token : GitHub PAT avec `read:packages`

## Troubleshooting

### Images privées sur GHCR

**Symptôme** : `unauthorized` lors du pull
**Solution** : Authentifier Docker sur Lothal (voir ci-dessus)

### Webhook 403

**Symptôme** : Webhook retourne 403
**Causes possibles** :
- Stack pas complètement déployée (attendre + refresh)
- Mauvaise URL (utiliser Funnel, pas URL interne)
- Stack ID incorrect

### Build échoue

**Symptôme** : Erreur database connection lors du build
**Solution** : Ajouter `ENV SKIP_ENV_VALIDATION=true` dans Dockerfile (étape builder)

### Compose file warning

**Symptôme** : `Found multiple config files: compose.yaml, docker-compose.yml`
**Solution** : Supprimer l'ancien `docker-compose.yml` du volume Docker :
```bash
ssh lothal "sudo rm /var/lib/docker/volumes/.../data/PROJECT/docker-compose.yml"
```

## Commandes Utiles

```bash
# Vérifier version déployée
ssh lothal "sudo docker inspect CONTAINER --format '{{.Image}}'"
ssh lothal "sudo docker images ghcr.io/theikid/PROJECT --format '{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}'"

# Logs d'un conteneur
ssh lothal "sudo docker logs CONTAINER --tail 100 -f"

# Redéployer manuellement
ssh lothal "cd /var/lib/docker/volumes/.../data/PROJECT && sudo docker compose pull && sudo docker compose up -d"

# Vérifier état des conteneurs
ssh lothal "sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'"
```

## Checklist Nouveau Projet

- [ ] Créer le repo GitHub (privé)
- [ ] Créer branche `develop`
- [ ] Ajouter `release.sh` (chmod +x)
- [ ] Configurer `next.config` avec `output: 'standalone'`
- [ ] Créer `Dockerfile` multi-stage
- [ ] Créer `compose.yaml` (pas docker-compose.yml)
- [ ] Ajouter `.dockerignore`
- [ ] Copier ce fichier `DEPLOYMENT.md`
- [ ] Supprimer workflows GitHub Actions (si existants)
- [ ] Login GHCR sur Mac : `docker login ghcr.io -u theikid`
- [ ] Créer première release : `./release.sh v1.0.0`
- [ ] Configurer repo dans Dockhand
- [ ] Créer stack dans Dockhand (From Git, branch main)
- [ ] Configurer webhook GitHub
- [ ] Tester déploiement

## Maintenance

### Mettre à jour une app

```bash
# 1. Développer sur develop
git checkout develop
# ... faire des modifications ...
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin develop

# 2. Créer une release
./release.sh v1.2.0

# 3. Le déploiement est automatique via webhook
```

### Rollback

```bash
# Revenir à une version précédente
ssh lothal
cd /var/lib/docker/volumes/.../data/PROJECT
sudo docker compose pull  # optional si l'ancienne image existe déjà
# Modifier compose.yaml pour pointer vers l'ancien tag
sudo sed -i 's/:latest/:v1.1.0/' compose.yaml
sudo docker compose up -d
```

## Support

- **Documentation Dockhand** : https://dockhand.maximeealet.com
- **Logs Dockhand** : Menu "Logs" dans l'interface
- **Repo infra** : https://github.com/theikid/infra-nas (Scarif configs)
