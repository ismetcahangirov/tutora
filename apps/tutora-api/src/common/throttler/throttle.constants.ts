import { seconds } from '@nestjs/throttler';

/**
 * Name of the single (default) throttler policy. Per-route overrides via
 * `@Throttle({ [DEFAULT_THROTTLER]: { ... } })` must target this same name.
 */
export const DEFAULT_THROTTLER = 'default';

// Tracking is per client IP (the guard's default). Mobile clients often share a
// public IP behind carrier-grade NAT or office networks, so limits are kept
// generous: high enough that a room full of real users never trips them, low
// enough that a single scripted abuser is stopped. `ttl` is a rolling window.

/** Baseline ceiling applied to every HTTP route as a broad abuse/DoS backstop. */
export const GLOBAL_THROTTLE = { ttl: seconds(60), limit: 300 } as const;

/**
 * Tighter budget for auth endpoints (token exchange, refresh, logout) — the prime
 * target for credential-stuffing and refresh-token brute force. Applied at the
 * controller, still roomy enough for many users sharing one NAT'd IP.
 */
export const AUTH_THROTTLE = { ttl: seconds(60), limit: 20 } as const;
