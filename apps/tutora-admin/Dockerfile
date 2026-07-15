# syntax=docker/dockerfile:1
#
# Production image for the admin panel (@tutora/admin): a Vite SPA compiled to
# static assets and served by Nginx. Build context is the MONOREPO ROOT.
#
#   docker build -f apps/tutora-admin/Dockerfile \
#     --build-arg VITE_API_URL=https://api.tutora.app -t tutora-admin .

# ── Build ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Vite inlines only VITE_* vars, and it does so at BUILD time — so the API URL
# must be provided as a build argument, not a runtime env var.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm --filter @tutora/admin build

# ── Runner ───────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner
# SPA routing + asset caching + a /healthz endpoint for the edge proxy.
COPY apps/tutora-admin/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/tutora-admin/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 -O /dev/null http://127.0.0.1:80/healthz || exit 1
