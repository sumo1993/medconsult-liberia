#!/bin/bash

# Backup existing .env.local
cp .env.local .env.local.backup.gmail

# Update SMTP settings for Gmail
sed -i '' 's|SMTP_HOST=.*|SMTP_HOST=smtp.gmail.com|' .env.local
sed -i '' 's|SMTP_PORT=.*|SMTP_PORT=587|' .env.local
sed -i '' 's|SMTP_USER=.*|SMTP_USER=medconsultliberia@gmail.com|' .env.local
sed -i '' 's|SMTP_PASS=.*|SMTP_PASS=cydamgeakbeivmma|' .env.local

echo "✅ .env.local updated with Gmail SMTP settings!"
echo ""
echo "Settings:"
echo "  SMTP_HOST=smtp.gmail.com"
echo "  SMTP_PORT=587"
echo "  SMTP_USER=medconsultliberia@gmail.com"
echo "  SMTP_PASS=cydamgeakbeivmma"
echo ""
echo "🔄 Restart your server to apply changes!"
