# 🔍 Email Change Debug Guide

## ❌ **Current Issue:**

Getting 400 (Bad Request) error when trying to change email.

---

## 🔧 **Debug Steps Added:**

### **1. Frontend Logging**
- Added `console.error` to log exact error message
- Added temporary `alert()` to show error immediately
- Increased notification time to 5 seconds

### **2. Backend Logging**
- Added logging to see request body
- Shows if password is present
- Shows new email value

---

## 📋 **How to Debug:**

### **Step 1: Try to Change Email**

1. **Login as client:**
   ```
   Email: student@example.com
   Password: Client@123
   ```

2. **Go to profile:**
   ```
   http://localhost:3000/dashboard/client/profile
   ```

3. **Click "Change Email"**

4. **Fill in form:**
   - New Email: `test@example.com`
   - Password: `Client@123`

5. **Click "Change Email"**

6. **Watch for:**
   - Alert popup with error message
   - Console error message
   - Terminal/server logs

---

### **Step 2: Check Browser Console**

Open browser console (F12) and look for:

```
[Email Change Error] { error: "..." }
```

This will show the exact error message from the server.

---

### **Step 3: Check Server Terminal**

Look at the terminal where Next.js is running for:

```
[Change Email] Request body: { newEmail: '...', hasPassword: true/false }
```

This shows what data the server received.

---

## 🐛 **Common Errors and Solutions:**

### **Error 1: "New email and password are required"**

**Cause:** Empty fields  
**Solution:** Make sure both fields are filled

---

### **Error 2: "Please enter a valid email address"**

**Cause:** Invalid email format  
**Solution:** Use format like `user@example.com`

---

### **Error 3: "Password is incorrect"**

**Cause:** Wrong password entered  
**Solution:** Enter your current password correctly

---

### **Error 4: "Email already in use"**

**Cause:** Email exists in database  
**Solution:** Try a different email address

---

### **Error 5: "New email must be different"**

**Cause:** Entered same email as current  
**Solution:** Enter a different email

---

### **Error 6: "Unauthorized"**

**Cause:** Not logged in or token expired  
**Solution:** Logout and login again

---

## 🔍 **What to Check:**

### **1. Are you logged in?**
```javascript
// Check in browser console
localStorage.getItem('auth-token')
// Should return a token string
```

### **2. Is the email field filled?**
- Check that `newEmail` has a value
- Check that `emailPassword` has a value

### **3. Is the password correct?**
- Try logging in with the password first
- Make sure it's your current password

### **4. Is the email format valid?**
- Must have @ symbol
- Must have domain (e.g., .com)
- Example: `user@example.com`

---

## 🧪 **Test with Known Values:**

### **Test 1: Valid Change**
```
Current Email: student@example.com
New Email: student2@example.com
Password: Client@123
Expected: Success
```

### **Test 2: Wrong Password**
```
Current Email: student@example.com
New Email: student2@example.com
Password: WrongPassword
Expected: "Password is incorrect"
```

### **Test 3: Invalid Email**
```
Current Email: student@example.com
New Email: notanemail
Password: Client@123
Expected: "Please enter a valid email address"
```

### **Test 4: Existing Email**
```
Current Email: student@example.com
New Email: admin@medconsult.com
Password: Client@123
Expected: "Email already in use"
```

---

## 📊 **Check Database:**

### **View Current Email:**
```sql
SELECT id, email, full_name 
FROM users 
WHERE email = 'student@example.com';
```

### **Check if New Email Exists:**
```sql
SELECT id, email, full_name 
FROM users 
WHERE email = 'test@example.com';
```

---

## 🔧 **Manual Test Script:**

Create `test-email-change.js`:

```javascript
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testEmailChange() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gorpunadoue@95',
    database: 'medconsult_liberia'
  });

  try {
    // Get user
    const [users] = await connection.execute(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      ['student@example.com']
    );

    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = users[0];
    console.log('✅ User found:', user.email);

    // Test password
    const testPassword = 'Client@123';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log('Password valid:', isValid);

    // Check if new email exists
    const newEmail = 'test@example.com';
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [newEmail]
    );

    if (existing.length > 0) {
      console.log('❌ Email already exists');
    } else {
      console.log('✅ Email available');
    }

  } finally {
    await connection.end();
  }
}

testEmailChange();
```

Run:
```bash
node test-email-change.js
```

---

## 📝 **What the Alerts Will Show:**

When you try to change email, you'll see an alert with:

- **"Error: Password is incorrect"** - Wrong password
- **"Error: Email already in use"** - Email exists
- **"Error: Please enter a valid email"** - Bad format
- **"Error: New email and password are required"** - Empty fields
- **"Error: Unauthorized"** - Not logged in

---

## 🎯 **Next Steps:**

1. **Try changing email** with the steps above
2. **Note the alert message** that appears
3. **Check browser console** for detailed error
4. **Check server terminal** for backend logs
5. **Report back** with the exact error message

---

## 💡 **Quick Fixes:**

### **If "Unauthorized":**
```javascript
// Logout and login again
localStorage.clear();
// Then go to /login
```

### **If "Password incorrect":**
```
// Make sure you're using the right password
// Try logging in first to verify
```

### **If "Email in use":**
```
// Try a completely unique email
// Example: myuniqueemail123@example.com
```

---

**🔍 The alerts and console logs will tell us exactly what's wrong!**
