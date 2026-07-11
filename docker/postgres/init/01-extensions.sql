-- Extensions the Tutora schema relies on. Runs once on first cluster init.
-- uuid-ossp: UUID primary keys · pg_trgm: fuzzy tutor search · citext: case-insensitive email.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";
