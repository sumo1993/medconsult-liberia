# Cookie Authentication Fix

## Problem
Cookies are not being sent with API requests even after successful login.

## Root Cause
The `secure` flag was set to `process.env.NODE_ENV === 'production'` which might be causing issues in development mode.

## Fix Applied
Changed cookie settings in `/app/api/auth/login/route.ts`:
- Set `secure: false` to allow cookies over HTTP in development
- Added debugging logs

## Testing Steps

### Step 1: Logout (if logged in)
Click "Logout" button

### Step 2: Clear Browser Cookies
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Cookies" → "http://localhost:3000"
4. Delete all cookies
5. Close DevTools

### Step 3: Login Fresh
1. Go to http://localhost:3000/login
2. Email: `admin@medconsult.com`
3. Password: `Admin@123`
4. Click "Sign in"

### Step 4: Check Server Logs
In your terminal, you should see:
```
Login successful, token set for user: admin@medconsult.com
Cookie will be set with token length: [some number]
```

### Step 5: Verify Cookie is Set
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Cookies" → "http://localhost:3000"
4. You should see `auth-token` cookie

### Step 6: Go to User Management
Navigate to http://localhost:3000/dashboard/admin/users

### Step 7: Check Server Logs Again
You should see:
```
verifyAuth - Cookies: ['auth-token']
verifyAuth - Token present: true
verifyAuth - Token decoded for user: admin@medconsult.com
verifyAuth - Success for user: admin@medconsult.com role: admin
```

### Step 8: Try Creating a User
1. Click "+ Add User"
2. Fill in the form
3. Click "Create User"

### Expected Server Logs:
```
Auth token present: true
All cookies: [ { name: 'auth-token', value: '...' } ]
Verified user: { userId: 1, email: 'admin@medconsult.com', role: 'admin' }
```

## If It Still Doesn't Work

### Check 1: Browser Console
Open console and type:
```javascript
document.cookie
```
Should show: `auth-token=...`

### Check 2: Network Tab
1. Open DevTools → Network tab
2. Try creating a user
3. Click the POST request to `/api/admin/users`
4. Go to "Headers" tab
5. Scroll to "Request Headers"
6. Look for "Cookie:" header
7. It should include `auth-token=...`

### Check 3: Try Different Browser
Sometimes browser security settings block cookies. Try:
- Chrome
- Firefox
- Safari

### Check 4: Disable Browser Extensions
Some extensions (ad blockers, privacy tools) block cookies.
Try in Incognito/Private mode.

## Alternative Solution: Use Session Storage

If cookies still don't work, we can switch to localStorage:

1. Store token in localStorage after login
2. Send token in Authorization header
3. Read from header in API routes

Let me know if you need this alternative approach.

## Debug Commands

### Check if logged in (browser console):
```javascript
document.cookie.includes('auth-token')
```

### Manually set cookie (browser console):
```javascript
document.cookie = "auth-token=test; path=/; max-age=604800"
```

### Check cookie from server (terminal):
```bash
curl -v http://localhost:3000/api/admin/stats
# Look for Set-Cookie header in response
```

---

**After applying this fix, logout, clear cookies, and login again!**
