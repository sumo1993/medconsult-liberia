# 📧 Gmail SMTP Setup Guide

## 🚀 **Quick Setup (10 minutes)**

---

## Step 1: Enable 2-Step Verification

1. **Go to:** https://myaccount.google.com/security
2. **Find:** "2-Step Verification" section
3. **Click:** "2-Step Verification"
4. **Turn it ON** (if not already enabled)
5. **Follow the prompts** to set it up with your phone

**Note:** You MUST enable 2-Step Verification before you can create App Passwords.

---

## Step 2: Generate App Password

1. **Go to:** https://myaccount.google.com/apppasswords
   
   OR
   
   - Go to: https://myaccount.google.com/security
   - Scroll down to "2-Step Verification"
   - Click "App passwords" at the bottom

2. **Select app:** Choose "Mail"

3. **Select device:** Choose "Other (Custom name)"
   - Type: "MedConsult Liberia"

4. **Click:** "Generate"

5. **Copy the 16-character password**
   - It looks like: `abcd efgh ijkl mnop`
   - Copy it immediately (you won't see it again)

---

## Step 3: Update .env.local

Open `.env.local` and change these lines:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=429319lr@gmail.com
SMTP_PASS=your-16-char-app-password
```

**Example:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=429319lr@gmail.com
SMTP_PASS=abcdefghijklmnop
```

**Important:**
- Remove spaces from the app password
- If it shows as `abcd efgh ijkl mnop`, make it `abcdefghijklmnop`

---

## Step 4: Test It

```bash
node test-brevo-connection.js
```

You should see:
```
✅ SUCCESS! SMTP connection verified!
✅ Test email sent successfully!
🎉 Check your inbox at 429319lr@gmail.com
```

---

## Step 5: Restart Server

```bash
npm run dev
```

---

## Step 6: Test Password Reset

1. Go to: http://localhost:3000/forgot-password
2. Enter: 429319lr@gmail.com
3. Click "Send Reset Instructions"
4. **Check your email!** 📧

---

## ✅ **What You'll Get:**

**Email will look like:**
```
From: MedConsult Liberia <429319lr@gmail.com>
Subject: Reset Your Password - MedConsult Liberia

[Beautiful HTML email with reset button]
```

**Note:** It will show your Gmail address as sender, which is fine for development/testing.

---

## 🔒 **Security Notes:**

- ✅ App Password is specific to this app
- ✅ Doesn't give access to your main Gmail
- ✅ Can be revoked anytime
- ✅ Safe to use

---

## 📊 **Gmail Limits:**

- ✅ 500 emails per day
- ✅ More than enough for your app
- ✅ Free forever

---

## 🎯 **Summary:**

1. Enable 2-Step Verification
2. Generate App Password
3. Update .env.local with Gmail settings
4. Test and enjoy!

**This will work immediately!** 🚀
