#!/usr/bin/env bash
#
# Create a compressed PostgreSQL backup and prune old ones.
#
# Environment:
#   DATABASE_URL             postgres connection URI (required)
#   BACKUP_DIR               output directory (default: /backups)
#   BACKUP_RETENTION_DAYS    delete dumps older than this (default: 7)
#
# Usage: DATABASE_URL=postgresql://user:pass@host:5432/db ./scripts/db/backup.sh
#
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

timestamp="$(date +%Y%m%d-%H%M%S)"
outfile="$BACKUP_DIR/tutora-$timestamp.dump"

echo "[backup] dumping database → $outfile"
# -Fc: custom (compressed, restorable with pg_restore). Write to a temp file
# first so a crash mid-dump never leaves a half-written backup behind.
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges --file="$outfile.tmp"
mv "$outfile.tmp" "$outfile"

size="$(du -h "$outfile" | cut -f1)"
echo "[backup] done ($size)"

echo "[backup] pruning dumps older than ${BACKUP_RETENTION_DAYS} day(s)"
find "$BACKUP_DIR" -name 'tutora-*.dump' -type f -mtime "+$BACKUP_RETENTION_DAYS" -print -delete

echo "[backup] current backups:"
ls -1t "$BACKUP_DIR"/tutora-*.dump 2>/dev/null || echo "  (none)"
