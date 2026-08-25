#!/usr/bin/env bash
# FLG-SEC-08 — reports whether the credentials currently in back/.env are still
# the ones exposed in the public git history.
#
# Prints "no match" (rotated, good) or "MATCH" (still exposed, rotate now) per
# key. It never prints, logs or stores a credential value: each value flows
# through a pipe into sha256sum and only digests are ever compared.
#
# Usage: bash scripts/verify-rotated-secrets.sh
set -uo pipefail

CURRENT_ENV="back/.env"
HISTORICAL_PATH="backend/.env"
HISTORICAL_COMMITS="ad10b11 2f45a2f"
KEYS="DB_PASSWORD JWT_SECRET"

if [ ! -f "$CURRENT_ENV" ]; then
  echo "error: $CURRENT_ENV not found — run this from the repository root." >&2
  exit 1
fi

EMPTY_SHA="$(printf '' | sha256sum | cut -d' ' -f1)"

# Reads KEY from a dotenv document on stdin and prints only its sha256.
# Strips CR (Windows line endings) and one layer of surrounding quotes.
hash_of() {
  sed -nE "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" \
    | head -n1 \
    | tr -d '\r' \
    | sed -E 's/^"(.*)"$/\1/; s/^'\''(.*)'\''$/\1/' \
    | tr -d '\n' \
    | sha256sum \
    | cut -d' ' -f1
}

status=0

for key in $KEYS; do
  current="$(hash_of "$key" < "$CURRENT_ENV")"

  if [ "$current" = "$EMPTY_SHA" ]; then
    echo "$key: NOT SET in $CURRENT_ENV — cannot verify"
    status=1
    continue
  fi

  for commit in $HISTORICAL_COMMITS; do
    historical="$(git show "$commit:$HISTORICAL_PATH" 2>/dev/null | hash_of "$key")"

    if [ "$historical" = "$EMPTY_SHA" ]; then
      echo "$key @ $commit: key absent in that commit — nothing to compare"
      continue
    fi

    if [ "$current" = "$historical" ]; then
      echo "$key @ $commit: MATCH — this value is public. Rotate it."
      status=1
    else
      echo "$key @ $commit: no match — rotated"
    fi
  done
done

exit $status
