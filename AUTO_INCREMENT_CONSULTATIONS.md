# Automatic Consultations Counter

## Overview
The total consultations counter automatically increments by 1 every time a client assignment is marked as "completed".

## Current Setup
- **Starting Value:** 100 consultations
- **Auto-Increment:** +1 per completed assignment
- **Display:** Homepage statistics section

## How It Works

### Automatic Process
1. Management/Admin marks an assignment as "completed"
2. System automatically increments `total_consultations` by 1
3. New count displays immediately on homepage
4. No manual intervention needed

### Workflow
```
Client Assignment Created
↓
Work in Progress
↓
Management marks as "Completed"
↓
✅ Consultations counter +1 (automatic)
↓
Updated count shows on homepage
```

## Examples

### Starting Point
```
Total Consultations: 100
```

### After 1 Completed Assignment
```
Total Consultations: 101 (+1)
```

### After 10 Completed Assignments
```
Total Consultations: 110 (+10)
```

### After 50 Completed Assignments
```
Total Consultations: 150 (+50)
```

## Technical Details

### Database
- **Table:** `statistics`
- **Column:** `total_consultations`
- **Type:** INT
- **Default:** 100

### API Endpoint
- **File:** `/app/api/management/assignments/[id]/route.ts`
- **Method:** PUT
- **Trigger:** When `status = 'completed'`

### Code Logic
```javascript
if (status === 'completed') {
  await pool.execute(
    'UPDATE statistics SET total_consultations = total_consultations + 1 WHERE id = 1'
  );
}
```

## Assignment Statuses

| Status | Increments Counter? |
|--------|---------------------|
| pending | ❌ No |
| in_progress | ❌ No |
| completed | ✅ Yes (+1) |
| cancelled | ❌ No |

## Monitoring

### View Current Count

**Option 1: Homepage**
- Visit the public homepage
- See "Total Consultations" in statistics section

**Option 2: Admin Dashboard**
- Go to Admin Dashboard → Statistics
- View current count

**Option 3: Database Query**
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
  const [stats] = await conn.execute('SELECT total_consultations FROM statistics WHERE id = 1');
  console.log('Total Consultations:', stats[0].total_consultations);
  await conn.end();
})();
"
```

## Manual Override

### Set Specific Number
If you need to manually adjust the count:

**Option 1: Admin Dashboard**
1. Go to Admin Dashboard
2. Click "Statistics"
3. Update "Total Consultations"
4. Click "Save Changes"

**Option 2: Database Script**
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
  await conn.execute('UPDATE statistics SET total_consultations = 100 WHERE id = 1');
  console.log('✅ Consultations set to 100');
  await conn.end();
})();
"
```

## Testing

### Test Auto-Increment
1. Go to Management Dashboard
2. Open any assignment
3. Mark it as "Completed"
4. Check homepage - count should increase by 1
5. Check server logs for: `✅ Consultation count incremented`

### Verify Count
```bash
# Before completing assignment
node -e "..." # Shows current count

# Complete an assignment via dashboard

# After completing assignment
node -e "..." # Shows count + 1
```

## Logs

When an assignment is completed, you'll see in the server logs:
```
✅ Consultation count incremented
```

## Important Notes

1. **Only "completed" status increments** - Other statuses don't affect the counter
2. **Automatic** - No manual work needed
3. **Real-time** - Updates immediately
4. **Persistent** - Stored in database
5. **Accurate** - Reflects actual completed work

## Timeline Example

| Date | Event | Total Consultations |
|------|-------|---------------------|
| Nov 21, 2025 | Initial setup | 100 |
| Nov 22, 2025 | 3 assignments completed | 103 |
| Nov 25, 2025 | 5 assignments completed | 108 |
| Dec 1, 2025 | 10 assignments completed | 118 |
| Dec 31, 2025 | 25 assignments completed | 143 |

## Benefits

1. **Accurate Tracking** - Real count of completed work
2. **Automatic** - No manual updates needed
3. **Credibility** - Shows actual consultations
4. **Motivating** - See progress grow
5. **Transparent** - Based on real data

## Related Features

- **Years Experience** - Auto-increments every January 1st
- **Research Projects** - Manual update via admin
- **Clinic Setups** - Manual update via admin
- **Rating** - Manual update via admin

## Troubleshooting

### Counter Not Incrementing

1. **Check Assignment Status**
   - Must be set to "completed" (exact match)
   - Other statuses won't trigger increment

2. **Check Server Logs**
   - Look for: `✅ Consultation count incremented`
   - If missing, status might not be "completed"

3. **Verify Database**
   ```bash
   # Check current value
   node -e "..." # See monitoring section
   ```

4. **Check API Response**
   - Should return: `{ success: true, message: "Assignment completed successfully" }`

### Manual Reset Needed

If counter needs to be reset or adjusted:
1. Use admin dashboard (Statistics page)
2. Or run database script (see Manual Override section)

## Files

- `/app/api/management/assignments/[id]/route.ts` - Main API with auto-increment
- `AUTO_INCREMENT_CONSULTATIONS.md` - This documentation

## Summary

✅ **Current:** 100 consultations
✅ **Auto-Increment:** +1 per completed assignment
✅ **Display:** Homepage statistics
✅ **Management:** Admin dashboard
✅ **Tracking:** Automatic and accurate
