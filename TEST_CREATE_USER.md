# Testing Create User Functionality

## Issue Fixed
The "Create User" button wasn't working because the fetch requests weren't including authentication cookies.

## What Was Changed
Added `credentials: 'include'` to all fetch requests in the users page:
- `fetchUsers()` - Now includes cookies when fetching user list
- `handleCreateUser()` - Now includes cookies when creating users

## How to Test

### Step 1: Login as Admin
1. Go to http://localhost:3000/login
2. Email: `admin@medconsult.com`
3. Password: `Admin@123`
4. Click "Sign in"

### Step 2: Go to User Management
1. Click "Manage Users" from dashboard
2. Or go directly to http://localhost:3000/dashboard/admin/users

### Step 3: Create a New User
1. Click the green "+ Add User" button
2. Fill in the form:
   - **Full Name**: Grace
   - **Email**: grace@gmail.com
   - **Phone**: +23178787865
   - **Role**: Client
   - **Password**: (your password - min 8 chars)
3. Click "Create User"

### Expected Result
✅ Alert: "User created successfully!"
✅ Modal closes
✅ User list refreshes
✅ New user "Grace" appears in the table

### Check Browser Console
Open browser DevTools (F12) and check Console tab:
- You should see: "Creating user with data: {...}"
- You should see: "Response status: 201"
- You should see: "User created: {...}"

### If It Still Doesn't Work
Check the console for errors:
- Status 401 = Not authenticated (try logging in again)
- Status 400 = Validation error (check all required fields)
- Status 500 = Server error (check terminal logs)

## Debugging Commands

### Check if admin is logged in:
```bash
# In browser console:
document.cookie
# Should show: auth-token=...
```

### Test API directly:
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "full_name": "Test User",
    "role": "client"
  }'
```

## Common Issues

### Issue: "Unauthorized" error
**Solution**: Login again, cookies may have expired

### Issue: "User already exists"
**Solution**: Use a different email address

### Issue: No error but user not created
**Solution**: Check browser console and network tab for actual error

### Issue: "Network error"
**Solution**: Check if dev server is running on port 3000

## Success Indicators
1. ✅ Alert shows "User created successfully!"
2. ✅ Modal closes automatically
3. ✅ User appears in the table
4. ✅ Console shows status 201
5. ✅ No errors in console

---

**The fix is now deployed! Try creating a user.**
