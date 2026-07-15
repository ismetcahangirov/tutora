# Database backups & restore

Automated, scheduled PostgreSQL backups with a tested restore procedure.

## How it works

The `db-backup` service (image: `docker/backup/Dockerfile`, built on
`postgres:15-alpine` so `pg_dump`/`pg_restore` match the server) runs
`scripts/db/backup.sh` on a fixed interval:

- Dumps the database in Postgres **custom format** (`-Fc`, compressed).
- Writes to the `backups` Docker volume as `tutora-<timestamp>.dump`.
- Prunes dumps older than the retention window.

Configuration (set in `.env`):

| Variable                  | Default | Meaning                          |
| ------------------------- | ------- | -------------------------------- |
| `BACKUP_INTERVAL_SECONDS` | `86400` | Seconds between backups (daily). |
| `BACKUP_RETENTION_DAYS`   | `7`     | Delete dumps older than this.    |

## Manual backup

```bash
docker compose -f docker-compose.prod.yml exec db-backup backup.sh
```

Or from any host with `psql` tools and the database URL:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/tutora BACKUP_DIR=./backups \
  ./scripts/db/backup.sh
```

## Copy a backup off the volume

```bash
# List available dumps
docker compose -f docker-compose.prod.yml exec db-backup ls -1t /backups

# Copy one to the host
docker compose -f docker-compose.prod.yml cp \
  db-backup:/backups/tutora-20260715-020000.dump ./
```

Store copies off-box (object storage) for disaster recovery.

## Restore

> **Destructive.** `restore.sh` drops and recreates objects in the target
> database. It refuses to run without confirmation (`FORCE=1` to skip the
> prompt).

```bash
# Into the running stack's database:
docker compose -f docker-compose.prod.yml exec db-backup \
  env FORCE=1 restore.sh /backups/tutora-20260715-020000.dump
```

From a workstation:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/tutora \
  ./scripts/db/restore.sh ./tutora-20260715-020000.dump
```

## Verify restores regularly

A backup you have never restored is not a backup. Periodically:

1. Restore the latest dump into a throwaway database.
2. Boot the API against it and hit `/api/v1/health` plus a couple of read paths.
3. Confirm row counts on key tables look right.

Document the date of the last verified restore in your ops log.
