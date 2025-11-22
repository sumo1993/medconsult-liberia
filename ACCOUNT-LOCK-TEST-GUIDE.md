# Account Lock Testing Guide

## 🔒 How to Test Account Locking Feature

### Prerequisites
1. Client must be logged in
2. Admin must be logged in (in a different browser or incognito window)
3. Development server must be running

### Step-by-Step Testing

#### Step 1: Login as Client
```
URL: http://localhost:3000/login
Email: student@example.com
Password: password123
```

#### Step 2: Open Browser Console
- Press F12 or right-click → Inspect
- Go to Console tab
- You should see logs like:
  ```
  [Client] Validating session...
  [Client] ✅ Session valid
  ```

#### Step 3: Login as Admin (Different Browser/Incognito)
```
URL: http://localhost:3000/login
Email: admin@example.com
Password: password123
```

#### Step 4: Lock the Client Account
1. Go to User Management
2. Find "Grace Zeah (student@example.com)"
3. Click the Lock/Suspend button
4. Confirm the action

#### Step 5: Watch Client Browser
Within 10 seconds, you should see:

**In Console:**
```
[Client] Validating session...
[Client] ❌ Session invalid, showing lock modal
```

**On Screen:**
- Beautiful modal appears with:
  - Red gradient header
  - Lock icon
  - "Account Locked" title
  - Message explaining the lock
  - Blue "OK" button

#### Step 6: Click OK
- Client is logged out
- Redirected to login page
- Cannot log in again (will show "Invalid email or password")

### Server-Side Logs

Check your terminal running `npm run dev`. You should see:

```
[Session Validation] Checking session...
verifyAuth - Token source: header
verifyAuth - Token present: true
verifyAuth - Token decoded for user: student@example.com
verifyAuth - User account is locked, not active. Denying access.
[Session Validation] ❌ User not authenticated or account locked
```

### Manual Database Testing

#### Lock Account Manually:
```sql
UPDATE users SET status = 'locked' WHERE email = 'student@example.com';
```

#### Unlock Account:
```sql
UPDATE users SET status = 'active' WHERE email = 'student@example.com';
```

#### Check Status:
```sql
SELECT email, status FROM users WHERE email = 'student@example.com';
```

### Using Test Script

Run the test script:
```bash
node test-account-lock.js
```

This will:
1. Show current account status
2. Lock the account
3. Verify the lock
4. Show instructions

### Troubleshooting

#### Issue: Client not being logged out

**Check:**
1. Is the session validation hook imported?
   - Check `/app/dashboard/client/page.tsx`
   - Should have: `useSessionValidation();`

2. Is the validation endpoint working?
   - Visit: `http://localhost:3000/api/auth/validate-session`
   - Should return 401 if account is locked

3. Check browser console for errors

4. Verify account status in database:
   ```bash
   node get-client-credentials.js
   ```

#### Issue: Modal not showing

**Check:**
1. Browser console for React errors
2. Verify hook file exists: `/hooks/useSessionValidation.tsx`
3. Check if modal is being blocked by z-index issues

#### Issue: Can still login after lock

**Check:**
1. Login API checks status:
   - File: `/lib/auth.ts`
   - Function: `authenticateUser`
   - Line 58: Should check `status = "active"`

### Expected Behavior Summary

✅ **When account is locked:**
- Client logged out within 10 seconds
- Modern modal appears
- Cannot log in again
- Server logs show denial

✅ **When account is unlocked:**
- Can log in normally
- Session validation passes
- Full access restored

### Validation Frequency

- Session checked: **Every 10 seconds**
- Immediate check: **On page load**
- Applies to: **All dashboard pages**

### Status Values

- `active` - Can log in and use system ✅
- `locked` - Cannot log in or use system 🔒
- `suspended` - Cannot log in or use system ⏸️
- `inactive` - Cannot log in or use system ❌

All non-active statuses will trigger account lock behavior.
