#!/usr/bin/env bash
# Run check.sh, then commit with short RU message.
# Usage: ./scripts/commit_checked.sh "сообщение коммита"

set -e
cd "$(dirname "$0")/.."

./scripts/check.sh

if [ -z "$1" ]; then
  echo "Usage: ./scripts/commit_checked.sh \"сообщение коммита\""
  exit 1
fi

git add -A
git commit -m "$1"
echo "Committed: $1"
