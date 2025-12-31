# Migration PNPM vers Bun

## Date de migration

2025-12-31

## Changements effectues

### Package Manager

- **Avant**: PNPM 10.26.2
- **Apres**: Bun 1.3.5

### Fichiers modifies

| Fichier                    | Changement                                                              |
| -------------------------- | ----------------------------------------------------------------------- |
| `package.json`             | `packageManager` mis a jour vers `bun@1.3.5`, seed Prisma utilise `bun` |
| `bunfig.toml`              | Nouvelle configuration Bun                                              |
| `.github/workflows/ci.yml` | Migration CI/CD vers Bun                                                |
| `docker/Dockerfile`        | Utilisation de l'image `oven/bun`                                       |
| `.gitignore`               | Ajout des entrees Bun                                                   |
| `bun.lock`                 | Nouveau lockfile (remplace `pnpm-lock.yaml`)                            |

### Fichiers supprimes

| Fichier          | Raison                  |
| ---------------- | ----------------------- |
| `pnpm-lock.yaml` | Remplace par `bun.lock` |

## Commandes mises a jour

| Ancienne commande   | Nouvelle commande  |
| ------------------- | ------------------ |
| `pnpm install`      | `bun install`      |
| `pnpm add <pkg>`    | `bun add <pkg>`    |
| `pnpm add -D <pkg>` | `bun add -d <pkg>` |
| `pnpm remove <pkg>` | `bun remove <pkg>` |
| `pnpm run <script>` | `bun run <script>` |
| `pnpx <pkg>`        | `bunx <pkg>`       |

## Installation pour les developpeurs

### Installer Bun

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Mettre a jour l'environnement local

```bash
# Supprimer l'ancien node_modules
rm -rf node_modules

# Installer avec Bun
bun install
```

## Rollback

En cas de probleme, le rollback est possible :

```bash
# Restaurer les fichiers PNPM depuis le backup
cp .migration-backup/pnpm-lock.yaml .

# Mettre a jour package.json
# Changer "packageManager": "bun@1.3.5" en "packageManager": "pnpm@10.26.2"

# Supprimer les fichiers Bun
rm bun.lock bunfig.toml

# Reinstaller avec PNPM
rm -rf node_modules
pnpm install
```

## Gains de performance

| Metrique              | PNPM   | Bun    | Gain estime |
| --------------------- | ------ | ------ | ----------- |
| Installation (cold)   | ~30s   | ~17s   | ~43%        |
| Installation (cached) | ~10s   | ~3s    | ~70%        |
| Taille lockfile       | 414 KB | 290 KB | ~30%        |

## Problemes connus

Aucun probleme majeur identifie lors de la migration.

## Contact

Pour toute question sur cette migration, ouvrir une issue sur le repository GitHub.
