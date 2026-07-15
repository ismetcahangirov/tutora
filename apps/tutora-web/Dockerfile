# syntax=docker/dockerfile:1
#
# Production image for the landing page (@tutora/web): Next.js in "standalone"
# output mode. Build context is the MONOREPO ROOT.
#
#   docker build -f apps/tutora-web/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.tutora.app -t tutora-web .

# ── Build ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# NEXT_PUBLIC_* is inlined at build time (into both the server and client
# bundles), so the API URL and Sentry DSN are provided as build arguments.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm --filter @tutora/web build

# ── Runner ───────────────────────────────────────────────────────────────────
# The standalone bundle (configured via outputFileTracingRoot = repo root)
# ships a minimal server + only the traced node_modules.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Bind to all interfaces so the container is reachable from the edge proxy.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=build --chown=node:node /app/apps/tutora-web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/tutora-web/.next/static ./apps/tutora-web/.next/static

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["node", "apps/tutora-web/server.js"]
