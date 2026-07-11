#!/usr/bin/env bash
# setup-labels.sh — Create or update all Tutora GitHub labels from .github/labels.json
#
# Prerequisites:
#   - GitHub CLI (gh) installed and authenticated:  gh auth login
#   - jq installed:  brew install jq  /  apt install jq
#
# Usage (run from the repo root):
#   bash scripts/setup-labels.sh
#
# The --force flag means existing labels are updated rather than erroring out.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LABELS_FILE="${REPO_ROOT}/.github/labels.json"

if [[ ! -f "${LABELS_FILE}" ]]; then
  echo "ERROR: labels file not found at ${LABELS_FILE}" >&2
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "ERROR: GitHub CLI (gh) is not installed or not in PATH." >&2
  echo "Install it from https://cli.github.com/ and run 'gh auth login'." >&2
  exit 1
fi

if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is not installed or not in PATH." >&2
  echo "Install it with: brew install jq  (macOS) or  apt install jq  (Debian/Ubuntu)" >&2
  exit 1
fi

echo "Setting up labels from ${LABELS_FILE} ..."
echo ""

count=0
total=$(jq '. | length' "${LABELS_FILE}")

jq -c '.[]' "${LABELS_FILE}" | while IFS= read -r label; do
  name=$(echo "${label}"        | jq -r '.name')
  color=$(echo "${label}"       | jq -r '.color')
  description=$(echo "${label}" | jq -r '.description')

  echo "  [$(( ++count ))/${total}] ${name}"
  gh label create "${name}" \
    --color "${color}" \
    --description "${description}" \
    --force
done

echo ""
echo "Done. All labels created / updated."
