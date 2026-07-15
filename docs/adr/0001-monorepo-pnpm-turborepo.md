# ADR-0001: Monorepo with pnpm workspaces and Turborepo

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Tutora core team

## Context

Tutora ships four applications — a mobile app, a backend API, an admin panel, and
a landing page — that share types, conventions, and tooling. They evolve together:
an API change often needs matching client changes in the same unit of work. We
needed a repository layout that keeps these in lockstep without the overhead of
publishing internal packages between separate repos.

## Decision

We will keep all applications in a **single repository** using **pnpm workspaces**
(`apps/*`, `packages/*`) with **Turborepo** as the task runner.

- pnpm gives fast, disk-efficient installs and a strict, single lockfile.
- A shared `@tutora/config` package centralizes Prettier, ESLint, and the base
  tsconfig so every app inherits the same standards.
- Turborepo orchestrates `build`, `lint`, `typecheck`, and `test` across
  workspaces with caching and correct task ordering.
- React Native / Metro does not follow pnpm's symlinked layout well, so the
  workspace uses `node-linker=hoisted`.

Alternatives rejected: **polyrepo** (cross-repo version drift, heavy coordination
for shared changes) and **Nx** (more framework than we need on top of Turborepo).

## Consequences

- One `pnpm install` sets up everything; atomic PRs can span the API and its
  clients.
- Shared config and types are consumed directly, with no publish step.
- CI runs from the root and scopes with `--filter`; a single cache speeds up
  incremental builds.
- Costs: a hoisted `node_modules` weakens dependency isolation, and pnpm's
  `allowBuilds` list must be curated for packages with native install scripts
  (Prisma, sharp, etc.).
