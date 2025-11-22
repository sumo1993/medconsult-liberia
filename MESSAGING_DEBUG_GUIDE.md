# 🔧 MESSAGING SYSTEM DEBUG GUIDE

## ❌ Error: "Failed to send reply"

### 🔍 How to Debug

Follow these steps to identify the exact issue:

---

## Step 1: Open Browser Console

1. **Open Developer Tools**: Press `F12` or `Cmd+Option+I` (Mac)
2. **Go to Console tab**
3. **Clear console**: Click the 🚫 icon
4. **Try to send a reply**
5. **Check for errors**

---

## Step 2: Check Console Output

Look for these messages:

### **Success** ✅:
```
Reply sent successfully!
```

### **Error** ❌:
```
Server error: { error: "...", details: "..." }
Error sending reply: ...
```

The `details` field will tell you exactly what went wrong!

---

## Common Errors & Solutions

### **Error 1: "Unauthorized"**
**Cause**: Not logged in or token expired

**Solution**:
1. Logout
2. Login again
3. Try sending reply

---

### **Error 2: "Message not found"**
**Cause**: Message ID doesn't exist or was deleted

**Solution**:
1. Refresh the messages page
2. Select a different message
3. Try again

---

### **Error 3: "Reply text is required"**
**Cause**: Empty reply text

**Solution**:
1. Type something in the reply box
2. Make sure it's not just spaces
3. Try again

---

### **Error 4: "Table 'message_replies' doesn't exist"**
**Cause**: Database table not created

**Solution**:
Run this SQL command:
```sql
CREATE TABLE IF NOT EXISTS message_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  reply_text TEXT NOT NULL,
  replied_by INT NOT NULL,
  replied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (message_id) REFERENCES contact_messages(id) ON DELETE CASCADE,
  FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_message (message_id),
  INDEX idx_replied_by (replied_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### **Error 5: "Cannot add or update a child row: a foreign key constraint fails"**
**Cause**: User ID or Message ID doesn't exist

**Solution**:
Check if the user and message exist:
```sql
-- Check if user exists
SELECT * FROM users WHERE id = YOUR_USER_ID;

-- Check if message exists
SELECT * FROM contact_messages WHERE id = MESSAGE_ID;
```

---

## Step 3: Check Network Tab

1. **Open Network tab** in Developer Tools
2. **Try to send reply**
3. **Look for the request** to `/api/messages/[id]/replies`
4. **Click on it**
5. **Check Response tab**

### What to look for:

**Status Code**:
- `200` = Success ✅
- `400` = Bad request (missing data)
- `401` = Unauthorized (not logged in)
- `403` = Forbidden (no access)
- `404` = Not found (message doesn't exist)
- `500` = Server error (check details)

**Response Body**:
```json
{
  "error": "Failed to send reply",
  "details": "Actual error message here",
  "stack": "Stack trace (in development)"
}
```

---

## Step 4: Check Server Logs

If you're running the dev server, check the terminal for errors:

```
Error sending reply: [Error details]
```

---

## Quick Test Commands

### Test 1: Check if table exists
```bash
mysql -u root -p medconsult_liberia -e "DESCRIBE message_replies;"
```

### Test 2: Check if messages exist
```bash
mysql -u root -p medconsult_liberia -e "SELECT id, name, email, subject FROM contact_messages LIMIT 5;"
```

### Test 3: Check if you can insert manually
```bash
mysql -u root -p medconsult_liberia -e "INSERT INTO message_replies (message_id, reply_text, replied_by) VALUES (1, 'Test reply', 1);"
```

### Test 4: Check existing replies
```bash
mysql -u root -p medconsult_liberia -e "SELECT * FROM message_replies;"
```

---

## Step 5: Verify Authentication

### Check if token exists:
```javascript
// In browser console
console.log(localStorage.getItem('auth-token'));
```

Should show a JWT token. If `null`, you need to login.

### Check user data:
```javascript
// In browser console
console.log(JSON.parse(localStorage.getItem('user')));
```

Should show user object with `id`, `email`, `role`.

---

## Step 6: Test API Directly

Use browser console to test the API:

```javascript
// Replace MESSAGE_ID with actual message ID
const messageId = 1;
const token = localStorage.getItem('auth-token');

fetch(`/api/messages/${messageId}/replies`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    reply_text: 'Test reply from console'
  })
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

---

## Expected Behavior

### **When it works** ✅:

1. Click "Send Reply"
2. Button shows "Sending..."
3. Reply appears in conversation thread
4. Green toast notification: "Reply sent successfully!"
5. Reply box clears

### **When it fails** ❌:

1. Click "Send Reply"
2. Button shows "Sending..."
3. Red toast notification: "Failed to send reply..."
4. Check console for error details

---

## Checklist

Before reporting an issue, verify:

- [ ] Logged in as doctor or client
- [ ] Selected a message
- [ ] Typed reply text (not empty)
- [ ] Browser console shows no errors
- [ ] Network tab shows request was sent
- [ ] Database table exists
- [ ] User has permission to reply

---

## Still Not Working?

If you've tried everything above and it still fails:

1. **Copy the error from console**
2. **Copy the network response**
3. **Note which user you're logged in as**
4. **Note which message you're trying to reply to**
5. **Share all this information**

---

## Example Debug Session

```
1. Open browser console ✅
2. Login as doctor ✅
3. Go to Contact Messages ✅
4. Click on a message ✅
5. Type reply: "Hello, I can help!" ✅
6. Click Send Reply ✅
7. Check console:
   
   Console Output:
   > Server error: { 
       error: "Failed to send reply",
       details: "Cannot add foreign key constraint"
     }
   
   This means: Message ID or User ID doesn't exist!
   
   Solution: Check if message exists in database
```

---

## Success Indicators

When everything works correctly, you should see:

### **In Browser**:
- ✅ Reply appears in conversation thread
- ✅ Green success notification
- ✅ Reply box clears
- ✅ No console errors

### **In Database**:
```sql
SELECT * FROM message_replies ORDER BY id DESC LIMIT 1;
```
Should show your new reply!

---

**Now try sending a reply again and check the browser console for the exact error message!** 🔧✅
