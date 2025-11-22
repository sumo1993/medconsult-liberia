# Debugging "Failed to create research post" Error

## Steps to Debug:

### 1. Check Browser Console
Open your browser's Developer Tools (F12) and check the Console tab for errors.

Look for:
- `API Error:` - Shows the server response
- `Submit Error:` - Shows any JavaScript errors
- Network errors

### 2. Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to create a post
4. Look for the request to `/api/research`
5. Click on it and check:
   - **Status Code**: Should be 201 (success) or 401/400/500 (error)
   - **Response**: Shows the error message from server
   - **Request Payload**: Shows what data was sent

### 3. Common Issues & Solutions:

#### Issue: "Unauthorized" (401)
**Cause**: Not logged in or token expired  
**Solution**: 
- Log out and log back in
- Check if `auth-token` exists in localStorage

#### Issue: "Title and content are required" (400)
**Cause**: Empty title or content  
**Solution**:
- Make sure you've entered a title
- Make sure you've added content in the rich text editor
- Try typing some text and saving again

#### Issue: "Failed to create research post" (500)
**Cause**: Database error  
**Solution**:
- Check if database migration ran successfully
- Verify all columns exist in `research_posts` table

#### Issue: Network error
**Cause**: Server not running or connection issue  
**Solution**:
- Make sure Next.js dev server is running (`npm run dev`)
- Check if you can access other pages

### 4. Quick Test:

Try creating a minimal post:
1. **Title**: "Test Post"
2. **Content**: Type "This is a test" in the rich text editor
3. **Leave everything else empty**
4. Click "Save Draft"

If this works, the issue is with optional fields (image, PDF, etc.)

### 5. Check Authentication:

Open browser console and run:
```javascript
console.log(localStorage.getItem('auth-token'));
```

If it returns `null`, you need to log in again.

### 6. Verify Database:

Run this to check table structure:
```bash
node check-table.js
```

Should show all columns including:
- featured_image
- featured_image_filename  
- featured_image_size
- download_count

### 7. Check Server Logs:

Look at your terminal where `npm run dev` is running.  
Any errors will appear there, especially:
- Database connection errors
- SQL errors
- Authentication errors

---

## Most Likely Causes:

1. **Empty content** - Rich text editor appears to have content but it's just HTML tags
2. **Not authenticated** - Token expired or missing
3. **Database migration not run** - Missing columns

---

## Quick Fixes:

### Fix 1: Clear and Re-login
```javascript
// In browser console:
localStorage.clear();
// Then log in again
```

### Fix 2: Check Content
Before submitting, check in console:
```javascript
// The content should have actual text, not just <p><br></p>
```

### Fix 3: Re-run Migration
```bash
node run-final-migration.js
```

---

## Need More Help?

Please provide:
1. Error message from browser console
2. Network tab response
3. Server terminal output
4. What you entered in the form

This will help identify the exact issue!
