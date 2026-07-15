# ADR-0006: Mobile on Expo with a TanStack Query state model

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Tutora core team

## Context

The mobile app is Tutora's primary surface and must ship to iOS and Android from
one codebase, with over-the-air updates, push notifications, and a maintainable
approach to state. A recurring source of bugs in React Native apps is conflating
**server state** (cached remote data) with **client state** (local UI), so we
wanted an explicit split.

## Decision

We will build the mobile app with **React Native + Expo** using **Expo Router**
(file-based routing under `src/app`), organized feature-first
(`src/features/*`), with a strict state model:

- **Server state → TanStack Query.** All remote data is fetched, cached,
  invalidated, and retried by React Query. We do not mirror server data into
  global stores.
- **Local/UI state → Zustand** (small, selector-based stores) or component state.
- **Persistence → MMKV** for fast key-value storage (filters, flags); secure
  tokens go to Expo Secure Store.
- `useEffect` is a last resort — used only to sync external systems, never to
  fetch data or derive state.

Expo also gives us EAS Build, EAS Update (OTA), and a managed native module story.

Alternatives rejected: **bare React Native** (more native maintenance, no managed
OTA/build pipeline) and **Redux for everything** (heavy boilerplate; wrong tool
for server cache, which React Query models directly).

## Consequences

- A clear, enforced boundary between server and client state removes a whole class
  of cache-sync bugs.
- Expo Router keeps navigation declarative and colocated with screens; EAS handles
  builds and OTA updates.
- Costs: we live within Expo's release cadence and native-module constraints, and
  developers must respect the state-ownership rules for the model to pay off.
