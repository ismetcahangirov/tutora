# ADR-0005: Google OAuth sign-in with rotating JWT refresh tokens

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Tutora core team

## Context

Tutora needs low-friction sign-in for students, parents, and tutors on mobile, and
a secure session model for a stateless API that also serves the admin panel. We
wanted to avoid storing passwords and to keep access checks cheap on every
request while still being able to revoke sessions.

## Decision

We will authenticate users with **Google OAuth** and issue our own tokens.

- The client obtains a Google `idToken`; the API verifies it and, on success,
  issues a short-lived **JWT access token** and a long-lived **refresh token**.
- Access tokens are **stateless** — validated by signature and expiry in a JWT
  guard — and carry the user's role, which `RolesGuard` enforces (fail-closed).
- Refresh tokens are **hashed at rest** and **rotated on every refresh**, with
  reuse detection: presenting a already-rotated token invalidates the chain.
- On mobile, the access token is held in memory/MMKV and the refresh token in
  Expo Secure Store; the client performs a **single-flight** refresh on 401.

Alternatives rejected: **email/password** (password storage/reset burden, higher
friction) and **opaque server-side sessions for every request** (a database or
cache lookup on every call; JWTs keep the hot path stateless).

## Consequences

- No passwords to store or leak; fast, stateless authorization on every request.
- Refresh-token rotation with reuse detection limits the blast radius of a stolen
  token; logout revokes the refresh token.
- Costs: sign-in depends on Google availability and a configured client ID, and
  access tokens can't be revoked before natural expiry (kept short to compensate).
