import { ApplicationStatus } from '@prisma/client';

/**
 * The application lifecycle as a small state machine (#32). Keys are the current
 * status; values are the statuses reachable from it. Terminal states have no
 * outgoing edges. `EXPIRED` is reachable from `PENDING` and is reserved for a
 * future background sweep (BullMQ) — no user action produces it.
 *
 *   PENDING ──▶ ACCEPTED ──▶ COMPLETED
 *      │  │  └────────────▶ CANCELLED
 *      │  └───────────────▶ DECLINED
 *      └──────────────────▶ CANCELLED / EXPIRED
 */
export const APPLICATION_TRANSITIONS: Readonly<Record<ApplicationStatus, ApplicationStatus[]>> = {
  [ApplicationStatus.PENDING]: [
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.DECLINED,
    ApplicationStatus.CANCELLED,
    ApplicationStatus.EXPIRED,
  ],
  [ApplicationStatus.ACCEPTED]: [ApplicationStatus.COMPLETED, ApplicationStatus.CANCELLED],
  [ApplicationStatus.DECLINED]: [],
  [ApplicationStatus.CANCELLED]: [],
  [ApplicationStatus.COMPLETED]: [],
  [ApplicationStatus.EXPIRED]: [],
};

/** Whether a status change from `from` to `to` is a legal lifecycle transition. */
export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_TRANSITIONS[from].includes(to);
}
