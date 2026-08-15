#!/usr/bin/env sh
set -eu

if [ "${CONFIRM_RESTORE:-}" != "YES" ]; then
  echo "Set CONFIRM_RESTORE=YES only after verifying the target database." >&2
  exit 2
fi

: "${BACKUP_URL:?BACKUP_URL is required}"
: "${BACKUP_ENCRYPTION_KEY:?BACKUP_ENCRYPTION_KEY is required}"
: "${DATABASE_URL:?DATABASE_URL must be a libpq connection string}"

work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

curl --fail --show-error --location "$BACKUP_URL" --output "$work_dir/database.dump.enc"
BACKUP_PASSPHRASE="$BACKUP_ENCRYPTION_KEY" openssl enc -d -aes-256-cbc -pbkdf2 \
  -in "$work_dir/database.dump.enc" -out "$work_dir/database.dump" -pass env:BACKUP_PASSPHRASE
pg_restore --exit-on-error --clean --if-exists --no-owner --no-acl \
  --dbname "$DATABASE_URL" "$work_dir/database.dump"

echo "Restore completed. Run application health and data-count checks before reopening traffic."
