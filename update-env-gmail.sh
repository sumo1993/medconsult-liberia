#!/bin/bash

set -euo pipefail

# Backup existing .env.local
cp .env.local .env.local.backup.gmail

# Upsert helper: replace key if present, otherwise append.
upsert_env() {
  local key="$1"
  local value="$2"
  local file=".env.local"
  if grep -q "^${key}=" "$file"; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf "\n%s=%s\n" "$key" "$value" >> "$file"
  fi
}

# Update SMTP settings for Gmail
upsert_env "SMTP_HOST" "smtp.gmail.com"
upsert_env "SMTP_PORT" "465"
upsert_env "SMTP_SECURE" "true"
upsert_env "SMTP_USER" "medconsultliberia@gmail.com"
upsert_env "SMTP_PASS" "uhaqmznpdkbukape"

echo "✅ .env.local updated with Gmail SMTP settings!"
echo ""
echo "Settings:"
echo "  SMTP_HOST=smtp.gmail.com"
echo "  SMTP_PORT=465"
echo "  SMTP_SECURE=true"
echo "  SMTP_USER=medconsultliberia@gmail.com"
echo "  SMTP_PASS=******** (set)"
echo ""
echo "🔄 Restart your server to apply changes!"
