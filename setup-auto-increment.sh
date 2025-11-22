#!/bin/bash

echo "🔧 Setting up automatic years increment..."
echo ""

# Get the current directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create cron job that runs every day at midnight
# It will check if it's January 1st and increment if so
CRON_JOB="0 0 * * * cd $PROJECT_DIR && /usr/local/bin/node cron-increment-years.js >> logs/cron-years.log 2>&1"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "cron-increment-years.js"; then
    echo "ℹ️  Cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added successfully!"
fi

echo ""
echo "📋 Cron job details:"
echo "   - Runs: Every day at midnight (00:00)"
echo "   - Checks: If date is January 1st"
echo "   - Action: Increments years_experience by 1"
echo "   - Logs: $PROJECT_DIR/logs/cron-years.log"
echo ""
echo "🧪 Test the script manually:"
echo "   node cron-increment-years.js"
echo ""
echo "📝 View cron jobs:"
echo "   crontab -l"
echo ""
echo "🗑️  Remove cron job:"
echo "   crontab -l | grep -v 'cron-increment-years.js' | crontab -"
echo ""
echo "✅ Setup complete!"
