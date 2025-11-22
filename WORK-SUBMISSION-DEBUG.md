# Work Submission Debug Guide

## Issue
"Failed to submit work" error when doctor tries to upload files.

## Debugging Steps

### Step 1: Check Browser Console
1. Login as doctor
2. Go to assignment page
3. Open browser console (F12)
4. Try to upload a file
5. Look for logs starting with `[Doctor]`

**Expected logs:**
```
[Doctor] Starting work submission...
[Doctor] File: document.pdf Size: 12345 Type: application/pdf
[Doctor] Has token: true
[Doctor] Reading file as base64...
[Doctor] File read successfully, data length: 16460
[Doctor] Sending to API...
[Doctor] Response status: 200
[Doctor] Success: {success: true, message: "Work submitted successfully", ...}
```

**If error occurs, check:**
- Response status (401, 403, 500?)
- Error message in response
- Any JavaScript errors

### Step 2: Check Server Logs
In terminal running `npm run dev`, look for:

```
[Submit Work] Starting upload...
[Submit Work] User: isaacbzeah2018@gmail.com Role: management
[Submit Work] Assignment ID: 2
[Submit Work] Received filename: document.pdf Has notes: true
[Submit Work] Uploading work for assignment: 2
[Submit Work] Filename: document.pdf Size: 12345 Type: application/pdf
[Submit Work] Work uploaded successfully
```

**If error occurs:**
- Check error message
- Check error stack trace
- Look for database errors

### Step 3: Common Issues

#### Issue A: 401 Unauthorized
**Console shows:** `[Doctor] Response status: 401`

**Solution:**
1. Logout and login again
2. Check if token exists: `localStorage.getItem('auth-token')`
3. Token might be expired

#### Issue B: 403 Forbidden
**Console shows:** `[Doctor] Response status: 403`
**Error:** "Only consultants can submit work"

**Solution:**
1. Make sure logged in as doctor, not client
2. Check user role in database:
   ```bash
   node get-doctor-credentials.js
   ```

#### Issue C: 400 Bad Request
**Console shows:** `[Doctor] Response status: 400`
**Error:** "File data and filename are required"

**Solution:**
1. File might not be reading correctly
2. Check file size - might be too large
3. Try a smaller file first

#### Issue D: 500 Server Error
**Console shows:** `[Doctor] Response status: 500`

**Check server logs for:**
- Database connection errors
- SQL syntax errors
- Buffer conversion errors
- File size limits

### Step 4: Database Check

Check if columns exist:
```bash
mysql -u root -p
use medconsult_liberia;
DESCRIBE assignment_requests;
```

Look for these columns:
- work_file_data (longblob)
- work_filename (varchar)
- work_file_size (int)
- work_file_type (varchar)
- work_submitted_at (timestamp)
- work_notes (text)

**If missing, run:**
```bash
node run-work-submission-migration.js
```

### Step 5: File Size Limits

**MySQL max_allowed_packet:**
```sql
SHOW VARIABLES LIKE 'max_allowed_packet';
```

Should be at least 16MB (16777216 bytes).

**If too small, increase it:**
```sql
SET GLOBAL max_allowed_packet=67108864; -- 64MB
```

Or edit MySQL config file (my.cnf/my.ini):
```
[mysqld]
max_allowed_packet=64M
```

### Step 6: Test with Small File

1. Create a small test file (< 1MB)
2. Try uploading that first
3. If works, issue is file size
4. If doesn't work, issue is elsewhere

### Step 7: Manual API Test

Test API directly with curl:

```bash
# Get your token
TOKEN="your-auth-token-here"

# Create base64 test data
echo "Test content" | base64

# Test upload (simplified)
curl -X POST http://localhost:3000/api/assignment-requests/2/submit-work \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileData": "data:text/plain;base64,VGVzdCBjb250ZW50Cg==",
    "filename": "test.txt",
    "notes": "Test upload"
  }'
```

### Expected Behavior

**Successful Upload:**
1. Browser console shows all steps completing
2. Server logs show successful upload
3. Success notification appears
4. File appears in "Previously Submitted" section
5. Message sent to client automatically

**File appears in database:**
```sql
SELECT id, title, work_filename, work_submitted_at 
FROM assignment_requests 
WHERE id = 2;
```

### Troubleshooting Checklist

- [ ] Migration ran successfully
- [ ] Database columns exist
- [ ] User is logged in as doctor
- [ ] Token is valid
- [ ] File is selected
- [ ] File size is reasonable (< 10MB)
- [ ] Browser console shows no errors
- [ ] Server logs show no errors
- [ ] max_allowed_packet is sufficient

### Quick Fixes

**Reset everything:**
```bash
# Re-run migration
node run-work-submission-migration.js

# Check credentials
node get-doctor-credentials.js

# Restart dev server
# Ctrl+C then:
npm run dev

# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Get Help

If still not working, provide:
1. Browser console logs (all `[Doctor]` lines)
2. Server terminal logs (all `[Submit Work]` lines)
3. Error message shown to user
4. File type and size you're trying to upload
5. User role (doctor/admin/client)

## Test Credentials

**Doctor:**
```
Email: isaacbzeah2018@gmail.com
Password: password123
```

**Assignment to test:**
```
Assignment ID: 2
Title: math
Status: payment_verified
```

## Success Indicators

✅ File uploads without errors
✅ Success notification appears
✅ "Previously Submitted" section shows file
✅ Client receives message notification
✅ File can be downloaded by client
✅ Server logs show success
✅ Browser console shows success
