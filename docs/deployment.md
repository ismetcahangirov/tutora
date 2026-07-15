# Deployment

How Tutora is built, containerized, and shipped. Covers the CI gate, the
production images, the Nginx edge, and the deploy pipeline.

## Overview

```
GitHub push/tag ─▶ CI (lint · typecheck · test · build)
                └▶ Deploy (build images ─▶ GHCR ─▶ optional SSH rollout)

Host ──▶ Nginx (TLS :443) ──▶ ┌── web    (Next.js, :3000)
                              ├── api    (NestJS, :3000)  ◀── postgres, redis
                              └── admin  (Nginx static, :80)
                                   db-backup ──▶ backups volume
```

## Continuous Integration (`.github/workflows/ci.yml`)

Runs on every push/PR to `main` and `develop`:

- **format** — Prettier check + commit-message lint (Conventional Commits).
- **verify** — a matrix of `lint`, `typecheck`, `test`, `build` run through Turbo
  across all workspace packages.

Make these required status checks in branch protection so failures block merges.

## Images

Each app has a multi-stage Dockerfile. **The build context is always the repo
root** (the apps share a pnpm workspace + lockfile).

| App    | Dockerfile                     | Runtime                          |
| ------ | ------------------------------ | -------------------------------- |
| API    | `apps/tutora-api/Dockerfile`   | Node 22, NestJS (`dist/main.js`) |
| Admin  | `apps/tutora-admin/Dockerfile` | Nginx serving the Vite SPA       |
| Web    | `apps/tutora-web/Dockerfile`   | Next.js standalone server        |
| Backup | `docker/backup/Dockerfile`     | Postgres client + scheduler      |

Public URLs are compiled into the client bundles, so `admin` and `web` take a
build argument (`VITE_API_URL` / `NEXT_PUBLIC_API_URL`).

Build locally:

```bash
docker build -f apps/tutora-api/Dockerfile -t tutora-api .
docker build -f apps/tutora-web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://tutora.app -t tutora-web .
```

## Edge proxy (Nginx)

`docker/nginx/` terminates TLS and routes by host/path:

- `https://<DOMAIN>/` → landing (web)
- `https://<DOMAIN>/api/`, `/docs`, `/socket.io/` → API (WebSocket-aware)
- `https://admin.<DOMAIN>/` → admin

`${DOMAIN}` is substituted from the container env at startup.

**TLS certificates** live in `docker/nginx/certs/` (git-ignored):

- Local / staging: `./scripts/nginx/generate-dev-certs.sh <domain>`
- Production: issue with certbot into `fullchain.pem` / `privkey.pem`, e.g.

  ```bash
  docker run --rm -v "$PWD/docker/nginx/certs:/out" \
    -v certbot-webroot:/var/www/certbot certbot/certbot certonly \
    --webroot -w /var/www/certbot -d tutora.app -d www.tutora.app -d admin.tutora.app
  ```

## Running the stack

```bash
cp .env.production.example .env      # then edit secrets
./scripts/nginx/generate-dev-certs.sh "$DOMAIN"   # or install real certs
docker compose -f docker-compose.prod.yml pull    # or `build`
docker compose -f docker-compose.prod.yml up -d
```

Boot order is enforced: Postgres/Redis become healthy → `migrate` applies
Prisma migrations and exits → `api` starts.

## Deploy pipeline (`.github/workflows/deploy.yml`)

On push to `main`, on `v*` tags, or manual dispatch:

1. **build-push** — builds all four images and pushes them to
   `ghcr.io/<owner>/tutora-<app>` (tagged with the commit SHA, branch, semver on
   tags, and `latest` on the default branch).
2. **deploy** — _optional._ SSHes to the host and runs `docker compose pull &&
up -d`. Skipped unless configured.

To enable remote rollout, set on the repository:

| Kind     | Name             | Purpose                      |
| -------- | ---------------- | ---------------------------- |
| Variable | `DEPLOY_ENABLED` | `true` to turn the job on    |
| Variable | `DEPLOY_PATH`    | repo path on the host        |
| Variable | `PUBLIC_API_URL` | baked into admin/web bundles |
| Secret   | `DEPLOY_HOST`    | server hostname / IP         |
| Secret   | `DEPLOY_USER`    | SSH user                     |
| Secret   | `DEPLOY_SSH_KEY` | private key for that user    |

See [`backups.md`](backups.md) for the database backup & restore runbook.
