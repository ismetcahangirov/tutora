#!/usr/bin/env bash
#
# Restore a PostgreSQL backup produced by backup.sh.
#
# WARNING: this DROPS and recreates objects in the target database. It refuses
# to run without an explicit confirmation.
#
# Environment:
#   DATABASE_URL   postgres connection URI of the target database (required)
#   FORCE=1        skip the interactive confirmation prompt
#
# Usage: DATABASE_URL=... ./scripts/db/restore.sh /backups/tutora-20260715-020000.dump
#
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  echo "usage: $0 <backup-file.dump>" >&2
  exit 2
fi
if [[ ! -f "$FILE" ]]; then
  echo "[restore] file not found: $FILE" >&2
  exit 1
fi

if [[ "${FORCE:-0}" != "1" ]]; then
  # Show the target host/db (without leaking the password) before confirming.
  target="$(printf '%s' "$DATABASE_URL" | sed -E 's#://[^@]*@#://***@#')"
  echo "[restore] about to OVERWRITE data in: $target"
  read -r -p "[restore] type 'yes' to continue: " answer
  [[ "$answer" == "yes" ]] || { echo "[restore] aborted"; exit 1; }
fi

echo "[restore] restoring $FILE"
# --clean --if-exists drops existing objects first; --no-owner keeps it portable
# across environments with different role names.
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname="$DATABASE_URL" "$FILE"

echo "[restore] done"
