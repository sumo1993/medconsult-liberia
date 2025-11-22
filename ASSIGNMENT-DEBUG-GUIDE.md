# Assignment Not Showing - Debug Guide

## Issue
Client sees "No requests found" even though assignments exist in database.

## Database Status
✅ **Confirmed:** 2 assignments exist for client (Grace Zeah, ID: 6)
- Assignment ID 2: "math" - Status: payment_verified
- Assignment ID 1: "bio" - Status: pending_review

## Debugging Steps

### Step 1: Check Browser Console
1. Login as client (student@example.com / password123)
2. Go to "My Assignments" page
3. Open browser console (F12)
4. Look for these logs:

```
[Client Assignments] Fetching assignments with token: true
[Client Assignments] Response status: 200
[Client Assignments] Received data: [...]
[Client Assignments] Number of assignments: 2
```

### Step 2: Check Server Logs
In your terminal running `npm run dev`, look for:

```
[API] Fetching assignment requests...
[API] User: student@example.com Role: client ID: 6
[API] Fetching assignments for client ID: 6
[API] Found 2 assignment(s)
[API] Returning 2 sanitized assignment(s)
```

### Step 3: Common Issues

#### Issue A: No Token
**Console shows:** `[Client Assignments] Fetching assignments with token: false`

**Solution:**
1. Logout and login again
2. Check if token is saved: `localStorage.getItem('auth-token')`
3. If null, login is not working properly

#### Issue B: 401 Unauthorized
**Console shows:** `[Client Assignments] Response status: 401`

**Solution:**
1. Token might be expired
2. Logout and login again
3. Check session validation isn't blocking

#### Issue C: Empty Data Array
**Console shows:** `[Client Assignments] Number of assignments: 0`
**Server shows:** `[API] Found 0 assignment(s)`

**Solution:**
Check user ID mismatch:
```bash
node check-client-assignments.js
```

#### Issue D: Network Error
**Console shows:** Error fetching requests

**Solution:**
1. Check if dev server is running
2. Check API route exists
3. Check for CORS issues

### Step 4: Manual API Test

Test the API directly:

```bash
# Get your token
# Login first, then in browser console:
localStorage.getItem('auth-token')

# Test API with curl (replace TOKEN):
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/assignment-requests
```

### Step 5: Database Direct Check

```bash
node check-client-assignments.js
```

This will show:
- Client ID
- All assignments for that client
- Assignment details

### Step 6: Force Refresh

If data exists but not showing:

1. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

2. **Clear localStorage**
   ```javascript
   localStorage.clear()
   ```
   Then login again

3. **Restart dev server**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

### Expected Behavior

When working correctly:

1. **Browser Console:**
   ```
   [Client Assignments] Fetching assignments with token: true
   [Client Assignments] Response status: 200
   [Client Assignments] Received data: Array(2)
   [Client Assignments] Number of assignments: 2
   ```

2. **Server Console:**
   ```
   [API] Fetching assignment requests...
   [API] User: student@example.com Role: client ID: 6
   [API] Fetching assignments for client ID: 6
   [API] Found 2 assignment(s)
   [API] Returning 2 sanitized assignment(s)
   ```

3. **UI:**
   - Shows 2 assignment cards
   - Each with title, status, and details
   - Tabs show correct counts

## Quick Fix Commands

```bash
# Check database
node check-client-assignments.js

# Create test assignment if none exist
# (Already done - 2 assignments exist)

# Reset client password
node fix-client-login.js

# Check all credentials
node get-client-credentials.js
```

## Contact Points

If still not working after all steps:
1. Share browser console logs
2. Share server terminal logs
3. Share screenshot of the page
4. Confirm you're logged in as: student@example.com
