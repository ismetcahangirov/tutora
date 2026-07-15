# syntax=docker/dockerfile:1
#
# Scheduled database backup sidecar. Based on the same Postgres major version as
# the server so pg_dump / pg_restore are wire-compatible. Build context is the
# MONOREPO ROOT so the scripts under scripts/db can be copied in.
#
#   docker build -f docker/backup/Dockerfile -t tutora-backup .

FROM postgres:15-alpine

# bash for the scripts; the postgres image already ships pg_dump / pg_restore.
RUN apk add --no-cache bash

COPY scripts/db/backup.sh /usr/local/bin/backup.sh
COPY scripts/db/restore.sh /usr/local/bin/restore.sh
COPY docker/backup/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh /usr/local/bin/entrypoint.sh

VOLUME ["/backups"]
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
