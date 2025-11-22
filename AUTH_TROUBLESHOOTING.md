# 🔐 Authentication Troubleshooting Guide

## ❌ Error: "Unauthorized - Authentication failed"

### 🔍 **Common Causes:**

1. **Token Expired** - JWT tokens expire after a certain time
2. **Token Cleared** - Browser cleared localStorage
3. **User Logged Out** - Manual or automatic logout
4. **Account Suspended** - Admin blocked the account
5. **Browser Changed** - Different browser/incognito mode
6. **Token Invalid** - Corrupted or tampered token

---

## 🛠️ **Quick Fixes**

### **Fix 1: Login Again** (Most Common)

1. **Logout** (if you see a logout button)
2. **Go to login page:** `/login`
3. **Enter credentials:**
   - Client: `student@example.com`
   - Doctor: `isaacbzeah2018@gmail.com`
4. **Login**
5. **Dashboard should load**

---

### **Fix 2: Clear Browser Data**

1. **Open Developer Tools** (F12)
2. **Go to Application tab**
3. **Clear Storage:**
   - localStorage → Clear all
   - Cookies → Clear all
4. **Refresh page**
5. **Login again**

---

### **Fix 3: Check Token Status**

1. **Open this file in browser:**
   ```
   file:///path/to/check-auth-token.html
   ```
   OR
2. **Open Developer Console** (F12)
3. **Run this:**
   ```javascript
   const token = localStorage.getItem('auth-token');
   console.log('Token:', token ? 'EXISTS' : 'MISSING');
   
   if (token) {
     fetch('/api/profile', {
       headers: { 'Authorization': `Bearer ${token}` }
     })
     .then(r => r.json())
     .then(d => console.log('Profile:', d))
     .catch(e => console.error('Error:', e));
   }
   ```

---

### **Fix 4: Verify Account Status**

Run this to check if account is active:
```bash
node check-client-user.js
```

Expected output:
```
✅ Grace Zeah (student@example.com)
   - Status: active ✅
```

If status is `suspended`:
```bash
node activate-client.js
```

---

## 🔍 **Detailed Diagnosis**

### **Step 1: Check Browser Console**

Look for these messages:

**Good Signs:**
```
[Client] ✅ Session valid
[Client Dashboard] Stats received: {...}
Profile data for ratings: {...}
```

**Bad Signs:**
```
[Client Dashboard] Stats fetch failed: "Unauthorized"
[Account Status] Unauthorized
verifyAuth - No token found
```

---

### **Step 2: Check Network Tab**

1. **Open Developer Tools** (F12)
2. **Go to Network tab**
3. **Refresh page**
4. **Look for `/api/client/stats` request**

**If Status 401:**
- Token is invalid or expired
- Need to login again

**If Status 200:**
- Token is valid
- Check response data

---

### **Step 3: Check localStorage**

**In Console, run:**
```javascript
console.log('Token:', localStorage.getItem('auth-token'));
console.log('User:', localStorage.getItem('user'));
```

**Expected:**
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
User: {"email":"student@example.com","role":"client"}
```

**If null:**
- You're not logged in
- Need to login

---

## 🔄 **Login Process**

### **Correct Login Flow:**

1. **Go to** `/login`
2. **Enter email and password**
3. **Click Login**
4. **Server validates credentials**
5. **Server generates JWT token**
6. **Token saved to localStorage**
7. **Redirect to dashboard**
8. **Dashboard loads with token**

### **What Can Go Wrong:**

**Problem:** Token not saved
- **Cause:** JavaScript error during login
- **Fix:** Check console for errors

**Problem:** Token saved but invalid
- **Cause:** Server error during token generation
- **Fix:** Login again

**Problem:** Token expires quickly
- **Cause:** Short expiration time
- **Fix:** Update JWT_SECRET expiration

---

## 🧪 **Testing Authentication**

### **Test 1: Fresh Login**

1. **Clear all data:**
   ```javascript
   localStorage.clear();
   ```

2. **Go to** `/login`

3. **Login with:**
   - Email: `student@example.com`
   - Password: [your password]

4. **Check console:**
   ```
   Should see: Login successful
   Should NOT see: Unauthorized
   ```

5. **Dashboard should load**

---

### **Test 2: Token Persistence**

1. **Login successfully**
2. **Close browser**
3. **Open browser again**
4. **Go to** `/dashboard/client`
5. **Should still be logged in**

If not logged in:
- Token not persisting
- Check localStorage settings

---

### **Test 3: Token Expiration**

1. **Login**
2. **Wait 1 hour** (or whatever expiration time)
3. **Refresh page**
4. **Should be logged out**
5. **Need to login again**

This is normal behavior.

---

## 🔧 **Advanced Troubleshooting**

### **Check JWT Token Validity**

**Decode token:**
```javascript
const token = localStorage.getItem('auth-token');
if (token) {
  const parts = token.split('.');
  const payload = JSON.parse(atob(parts[1]));
  console.log('Token payload:', payload);
  console.log('Expires:', new Date(payload.exp * 1000));
  console.log('Is expired:', Date.now() > payload.exp * 1000);
}
```

---

### **Check Server Logs**

Look for these in terminal:

**Good:**
```
verifyAuth - Token decoded for user: student@example.com
verifyAuth - Success for user: student@example.com role: client
[Client Stats] Fetching stats for user: student@example.com ID: 6
```

**Bad:**
```
verifyAuth - No token found in cookie or header
verifyAuth - User not found
verifyAuth - User account is suspended
```

---

### **Check Database**

```bash
node check-client-user.js
```

Should show:
```
✅ Grace Zeah (student@example.com)
   - Role: client
   - Status: active ✅
```

---

## 🚨 **Emergency Fixes**

### **Can't Login At All**

1. **Check database connection:**
   ```bash
   node test-ratings.js
   ```

2. **Reset client password:**
   ```bash
   # Create reset-password.js script
   # Or use admin panel
   ```

3. **Check user exists:**
   ```bash
   node check-client-user.js
   ```

4. **Activate account:**
   ```bash
   node activate-client.js
   ```

---

### **Token Issues Persist**

1. **Clear everything:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   // Clear cookies in browser settings
   ```

2. **Restart browser**

3. **Try incognito mode**

4. **Login fresh**

---

## 📋 **Checklist**

Before reporting auth issues:

- [ ] Tried logging in again
- [ ] Checked browser console for errors
- [ ] Verified token exists in localStorage
- [ ] Checked account status (active/suspended)
- [ ] Cleared browser data and retried
- [ ] Tested in incognito mode
- [ ] Checked server is running
- [ ] Verified database connection

---

## 🎯 **Most Common Solution**

**90% of "Unauthorized" errors are fixed by:**

1. **Logout** (if possible)
2. **Clear localStorage:**
   ```javascript
   localStorage.clear();
   ```
3. **Go to** `/login`
4. **Login again**
5. **Done!**

---

## 📞 **Still Having Issues?**

**Collect this information:**

1. **Browser console logs** (full output)
2. **Network tab** (screenshot of failed requests)
3. **localStorage contents:**
   ```javascript
   console.log(localStorage);
   ```
4. **Account status:**
   ```bash
   node check-client-user.js
   ```
5. **Steps to reproduce**

---

## ✅ **Prevention Tips**

1. **Don't clear browser data** while logged in
2. **Use same browser** consistently
3. **Don't edit localStorage** manually
4. **Login regularly** if tokens expire
5. **Keep browser updated**

---

**🎉 Most authentication issues are resolved by simply logging in again!**
