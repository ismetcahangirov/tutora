#!/usr/bin/env bash
#
# Generate a self-signed TLS certificate for local / staging use so the edge
# proxy can start with HTTPS. Production uses real certificates (see
# docs/deployment.md — Let's Encrypt / certbot).
#
#   ./scripts/nginx/generate-dev-certs.sh [domain]
#
set -euo pipefail

DOMAIN="${1:-localhost}"
CERT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/docker/nginx/certs"

mkdir -p "$CERT_DIR"

if [[ -f "$CERT_DIR/fullchain.pem" && -f "$CERT_DIR/privkey.pem" ]]; then
  echo "Certificates already exist in $CERT_DIR — remove them to regenerate."
  exit 0
fi

echo "Generating self-signed certificate for '$DOMAIN' (and *.$DOMAIN)…"
openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,DNS:*.$DOMAIN"

echo "Wrote:"
echo "  $CERT_DIR/fullchain.pem"
echo "  $CERT_DIR/privkey.pem"
