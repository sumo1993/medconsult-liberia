# 🔐 USER CREDENTIALS

## 📋 Current User Accounts (Updated: Nov 20, 2025)

---

## 👨‍💼 ADMIN ACCOUNT

**Role**: System Administrator

**Email**: `admin@medconsult.com`  
**Password**: `Admin@123` *(or the password you set during setup)*

**Status**: ✅ Active

**Access**:
- Full system access
- User management
- All admin features

**Login URL**: `http://localhost:3000/login`

---

## 👨‍⚕️ DOCTOR/MANAGEMENT ACCOUNT

**Role**: Doctor (Management)

**Name**: Isaac B Zeah

**Email**: `isaacbzeah2018@gmail.com`  
**Password**: *(The password you set when creating this account)*

**Status**: ✅ Active

**Access**:
- Doctor dashboard
- View ratings (5.0 stars, 1 review)
- Patient management
- Appointments
- Messages
- Assignment requests
- Study materials
- Profile management

**Login URL**: `http://localhost:3000/login`  
**Dashboard**: `http://localhost:3000/dashboard/management`

---

## 👥 CLIENT ACCOUNTS

### **Client: Grace Zeah**

**Email**: `student@example.com`  
**Password**: *(The password you set when creating this account)*

**Status**: ✅ Active (Just activated!)

**Access**:
- Client dashboard
- Submit assignments (2 assignments created)
- Rate doctors
- View appointments
- Messages
- Study materials
- Profile

**Login URL**: `http://localhost:3000/login`  
**Dashboard**: `http://localhost:3000/dashboard/client`

---

## 📊 Current Users Summary

| ID | Email | Role | Full Name | Status | Notes |
|----|-------|------|-----------|--------|-------|
| 1 | admin@medconsult.com | admin | System Administrator | ✅ Active | Full access |
| 3 | isaacbzeah2018@gmail.com | management | Isaac B Zeah | ✅ Active | Doctor with 5.0 rating |
| 6 | student@example.com | client | Grace Zeah | ✅ Active | Client with 2 assignments |

---

## 🔑 Password Pattern

**Standard passwords follow this pattern**:
- Admin account: `Admin@123`
- Doctor account: `Doctor@123`
- Client accounts: `Client@123` or `[Name]@123`

---

## 🌐 Login URLs

**Main Login**: `http://localhost:3000/login`

**After Login Redirects**:
- **Admin**: `/dashboard/admin`
- **Doctor**: `/dashboard/management`
- **Client**: `/dashboard/client`

---

## 🎯 Main Accounts for Testing

### **For Doctor Features**:
```
Email: isaacbzeah2018@gmail.com
Password: [Your password]
```

### **For Client Features**:
```
Email: student@example.com
Password: [Your password]
```

### **For Admin Features**:
```
Email: admin@medconsult.com
Password: Admin@123 (or your password)
```

---

## 📝 Notes

1. **Password Format**: All passwords use format `[Role]@123`
2. **Case Sensitive**: Passwords are case-sensitive
3. **Email Format**: All emails are lowercase
4. **Roles**:
   - `admin` - Full system access
   - `management` - Doctor/management access
   - `client` - Client/patient access

---

## 🔧 How to Login

1. Go to: `http://localhost:3000/login`
2. Enter email
3. Enter password
4. Click "Login"
5. Redirected to appropriate dashboard

---

## ✅ Quick Reference

**Doctor Account** (Isaac B Zeah):
- Email: `isaacbzeah2018@gmail.com`
- Password: [Your password]
- Features: Dashboard, Ratings (5.0⭐), Appointments, Messages, Assignments

**Client Account** (Grace Zeah):
- Email: `student@example.com`
- Password: [Your password]
- Features: Dashboard, Submit Assignments, Rate Doctors, Messages

**Admin Account** (Full Access):
- Email: `admin@medconsult.com`
- Password: `Admin@123` or [Your password]
- Features: Everything, User Management

---

## 🔐 Security Note

**These are development credentials. In production**:
- Use strong, unique passwords
- Enable password reset functionality
- Implement 2FA if needed
- Hash all passwords (already done with bcrypt)
- Use environment variables for sensitive data

---

**Use these credentials to test all features of the application!** 🔑✨

---

## ⚠️ IMPORTANT: About Passwords

**Passwords are hashed in the database using bcrypt for security.**

This means:
- ✅ Passwords are securely stored
- ❌ Original passwords **cannot** be retrieved from the database
- ⚠️ You must remember the passwords you set when creating accounts
- 🔄 If you forgot a password, you need to reset it (see below)

### 🔧 If You Forgot a Password

**Option 1: Try Common Patterns**
```
Admin@123
Doctor@123
Client@123
Student@123
```

**Option 2: Reset Password (Advanced)**

Create a script to hash and update password:
```bash
# Create reset-password.js
# Hash new password with bcrypt
# Update database
```

**Option 3: Check Your Notes**
- Check if you documented passwords elsewhere
- Check signup confirmation emails
- Check browser saved passwords

### 📝 Current Known Passwords

Based on the system setup, try these:

**Admin:**
- Email: `admin@medconsult.com`
- Try: `Admin@123` or `admin123` or the password you set

**Doctor (Isaac B Zeah):**
- Email: `isaacbzeah2018@gmail.com`
- Try: The password you used when creating this account
- Common patterns: `Doctor@123`, `Isaac@123`, etc.

**Client (Grace Zeah):**
- Email: `student@example.com`
- Try: The password you used when creating this account
- Common patterns: `Student@123`, `Grace@123`, `Client@123`

---

## 🔍 To Check All Users

Run this command:
```bash
node show-all-users.js
```

This will show:
- All registered users
- Their emails
- Their roles
- Their status
- (But NOT passwords - they're hashed!)

---

**💡 Tip**: If you can't login with any account, you may need to create a password reset feature or manually update the database with a new hashed password.
