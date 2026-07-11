-- Minimal smoke-test seed so `docker compose up` can be verified end-to-end
-- before the Prisma schema exists. Ops-only; safe to drop. Domain seed data
-- arrives with the database/Prisma epic.
CREATE TABLE IF NOT EXISTS platform_health (
  id integer PRIMARY KEY,
  status text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_health (id, status)
VALUES (1, 'ok')
ON CONFLICT (id) DO NOTHING;
