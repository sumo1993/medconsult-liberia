# Automatic Years Experience Increment

## Overview
This system automatically increments the "Years of Experience" statistic by 1 every January 1st.

## How It Works

### Current Setup
- **Current Years:** 15
- **Next Increment:** January 1, 2026 → Will become 16
- **Future:** January 1, 2027 → Will become 17
- And so on...

### Automatic Process
1. Cron job runs every day at midnight (00:00)
2. Script checks if today is January 1st
3. If yes, increments `years_experience` by 1
4. If no, does nothing
5. Logs all activity to `logs/cron-years.log`

## Setup Instructions

### Option 1: Automatic Setup (Recommended)
```bash
./setup-auto-increment.sh
```

This will:
- Create the cron job
- Set up logging directory
- Configure automatic execution

### Option 2: Manual Setup
Add this to your crontab (`crontab -e`):
```
0 0 * * * cd /Users/mac/CascadeProjects/medconsult-liberia && /usr/local/bin/node cron-increment-years.js >> logs/cron-years.log 2>&1
```

## Testing

### Test the Script Manually
```bash
node cron-increment-years.js
```

**Note:** It will only increment on January 1st. On other days, it will show:
```
ℹ️  Not January 1st - no update needed
📅 Current date: [current date]
```

### Force Test (For Development)
To test the increment logic, temporarily modify `cron-increment-years.js`:
```javascript
// Change this line:
const isJanuaryFirst = today.getMonth() === 0 && today.getDate() === 1;

// To this (always true):
const isJanuaryFirst = true;
```

Then run:
```bash
node cron-increment-years.js
```

**Remember to change it back after testing!**

## Monitoring

### View Logs
```bash
tail -f logs/cron-years.log
```

### Check Cron Jobs
```bash
crontab -l
```

### View Current Statistics
```bash
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });
  const [stats] = await conn.execute('SELECT years_experience FROM statistics WHERE id = 1');
  console.log('Current years:', stats[0].years_experience);
  await conn.end();
})();
"
```

## Manual Override

### Set Specific Year
```bash
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });
  await conn.execute('UPDATE statistics SET years_experience = 15 WHERE id = 1');
  console.log('✅ Years set to 15');
  await conn.end();
})();
"
```

Or use the admin dashboard:
1. Go to Admin Dashboard
2. Click "Statistics"
3. Update "Years of Experience"
4. Click "Save Changes"

## Troubleshooting

### Cron Job Not Running
1. Check if cron service is running:
   ```bash
   sudo launchctl list | grep cron
   ```

2. Check cron logs:
   ```bash
   tail -f logs/cron-years.log
   ```

3. Verify node path:
   ```bash
   which node
   ```
   Update the cron job if path is different.

### Remove Cron Job
```bash
crontab -l | grep -v 'cron-increment-years.js' | crontab -
```

## Timeline Example

| Date | Years Experience |
|------|------------------|
| Now (2025) | 15 |
| Jan 1, 2026 | 16 (auto) |
| Jan 1, 2027 | 17 (auto) |
| Jan 1, 2028 | 18 (auto) |
| Jan 1, 2029 | 19 (auto) |
| Jan 1, 2030 | 20 (auto) |

## Files

- `cron-increment-years.js` - Main script that increments years
- `setup-auto-increment.sh` - Setup script for cron job
- `logs/cron-years.log` - Log file for cron execution
- `AUTO_INCREMENT_YEARS.md` - This documentation

## Notes

- The increment happens automatically at midnight on January 1st
- No manual intervention needed
- Logs are kept for monitoring
- Can be manually overridden via admin dashboard
- Safe to run multiple times on same day (won't double-increment)
