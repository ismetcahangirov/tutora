#!/usr/bin/env bash
#
# Scheduler for the db-backup service. Runs backup.sh on a fixed interval.
# A plain sleep loop (rather than cron) keeps the container simple and its logs
# visible via `docker compose logs`.
#
# Environment:
#   BACKUP_INTERVAL_SECONDS   seconds between runs (default: 86400 = daily)
#   RUN_ON_START              run one backup immediately on boot (default: 1)
#   ...plus everything backup.sh reads (DATABASE_URL, BACKUP_DIR, retention).
#
set -euo pipefail

INTERVAL="${BACKUP_INTERVAL_SECONDS:-86400}"
RUN_ON_START="${RUN_ON_START:-1}"

run_backup() {
  if ! /usr/local/bin/backup.sh; then
    echo "[scheduler] backup FAILED — will retry next cycle" >&2
  fi
}

echo "[scheduler] starting; interval=${INTERVAL}s"
[[ "$RUN_ON_START" == "1" ]] && run_backup

while true; do
  echo "[scheduler] next backup in ${INTERVAL}s"
  sleep "$INTERVAL"
  run_backup
done
