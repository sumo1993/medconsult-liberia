# 🔧 Rating System Troubleshooting Guide

## Issue: Doctor Cannot See Ratings

### ✅ **Quick Checks**

1. **Login as Doctor**
   - Go to `/login`
   - Use doctor credentials (isaacbzeah2018@gmail.com)
   - Ensure you're logged in as role: `management`

2. **Check Dashboard**
   - Go to `/dashboard/management`
   - Look for the **yellow/orange rating card**
   - Should show average rating and total reviews

3. **Check Ratings Page**
   - Click "View All Reviews" button OR
   - Go directly to `/dashboard/management/ratings`
   - Should see list of all ratings

4. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for these logs:
     - `Profile data for ratings: {...}`
     - `Fetching ratings for doctor ID: 3`
     - `Ratings data received: {...}`
     - `Stats calculated: {...}`

---

## 🔍 **Debugging Steps**

### **Step 1: Verify Rating Exists in Database**

Run this test script:
```bash
node test-ratings.js
```

Expected output:
```
✅ Ratings table exists
✅ Total Ratings: 1 (or more)
✅ Sample Ratings: Grace Zeah rated Isaac B Zeah: 5 stars
✅ Doctors: Isaac B Zeah (ID: 3): Avg 5.00, Total 1
```

---

### **Step 2: Check API Endpoint**

Test the API directly:

**Get Doctor Profile:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/profile
```

Should return:
```json
{
  "id": 3,
  "full_name": "Isaac B Zeah",
  "average_rating": "5.00",
  "total_ratings": 1,
  ...
}
```

**Get Doctor Ratings:**
```bash
curl http://localhost:3000/api/ratings?doctorId=3
```

Should return:
```json
{
  "ratings": [
    {
      "id": 1,
      "rating": 5,
      "review": "...",
      "client_name": "Grace Zeah",
      "assignment_title": "...",
      ...
    }
  ]
}
```

---

### **Step 3: Check Browser Network Tab**

1. Open Developer Tools (F12)
2. Go to Network tab
3. Navigate to `/dashboard/management`
4. Look for these requests:
   - `GET /api/profile` - Should return 200 with rating data
   - `GET /api/ratings?doctorId=3` - Should return 200 with ratings array

5. Click on each request and check:
   - **Status:** Should be 200
   - **Response:** Should contain rating data
   - **Headers:** Should have Authorization token

---

### **Step 4: Check Console Logs**

Expected console logs when loading dashboard:

```javascript
Profile data for ratings: {
  average_rating: "5.00",
  total_ratings: 1
}
```

Expected console logs when loading ratings page:

```javascript
Fetching ratings for doctor ID: 3
[Rating] Found ratings for doctor 3 : 1
Ratings data received: {
  ratings: [{
    id: 1,
    rating: 5,
    review: "...",
    client_name: "Grace Zeah",
    assignment_title: "..."
  }]
}
Stats calculated: { total: 1, avg: 5 }
```

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: Rating Card Shows "N/A"**

**Cause:** Profile doesn't have rating data

**Fix:**
1. Check if `average_rating` and `total_ratings` columns exist in users table
2. Run migration: `node run-ratings-migration.js`
3. Verify data: `node test-ratings.js`

---

### **Issue 2: Ratings Page Shows "No Reviews Yet"**

**Cause:** API not returning ratings

**Possible Fixes:**

**A. Wrong Doctor ID**
- Check console: `Fetching ratings for doctor ID: X`
- Verify this matches the doctor who received ratings
- Doctor ID should be 3 for Isaac B Zeah

**B. API Error**
- Check console for error messages
- Check server logs for `[Rating] Error fetching ratings`
- Verify database connection

**C. No Ratings in Database**
- Run `node test-ratings.js`
- If no ratings, create one as a client
- Complete an assignment and rate the doctor

---

### **Issue 3: Console Shows Errors**

**Error: "Profile fetch failed: 401"**
- **Fix:** Login again, token expired

**Error: "Failed to fetch ratings: doctorId required"**
- **Fix:** Profile API not returning user ID
- Check `/api/profile` response

**Error: "Cannot read property 'ratings' of undefined"**
- **Fix:** API response format issue
- Check API returns `{ ratings: [...] }`

---

## ✅ **Verification Checklist**

Before reporting issue, verify:

- [ ] Logged in as doctor (role: management)
- [ ] Rating exists in database (run test-ratings.js)
- [ ] Profile has average_rating and total_ratings columns
- [ ] API endpoint `/api/ratings?doctorId=3` returns data
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls
- [ ] Rating card visible on dashboard
- [ ] Ratings page accessible at `/dashboard/management/ratings`

---

## 🧪 **Test Scenario**

### **Complete Test Flow:**

1. **As Client (Grace Zeah):**
   - Login as client
   - Go to completed assignment
   - Rate doctor 5 stars
   - Write review: "Excellent work!"
   - Submit rating

2. **As Doctor (Isaac B Zeah):**
   - Login as doctor
   - Go to `/dashboard/management`
   - **Should see:** Rating card with 5.0 average, 1 review
   - Click "View All Reviews"
   - **Should see:** Review from Grace Zeah with 5 stars

3. **Verify Database:**
   ```bash
   node test-ratings.js
   ```
   - **Should show:** 1 rating, doctor has avg 5.00

---

## 🔧 **Manual Database Check**

If all else fails, check database directly:

```sql
-- Check ratings table
SELECT * FROM ratings;

-- Check doctor's rating stats
SELECT id, full_name, average_rating, total_ratings 
FROM users 
WHERE role = 'management';

-- Check ratings with details
SELECT 
  r.id,
  r.rating,
  r.review,
  c.full_name as client_name,
  d.full_name as doctor_name,
  ar.title as assignment_title
FROM ratings r
JOIN users c ON r.client_id = c.id
JOIN users d ON r.doctor_id = d.id
JOIN assignment_requests ar ON r.assignment_request_id = ar.id;
```

---

## 📞 **Still Not Working?**

### **Collect This Information:**

1. **Browser Console Logs**
   - Copy all console messages
   - Include errors and warnings

2. **Network Tab**
   - Screenshot of API requests
   - Response data for `/api/profile` and `/api/ratings`

3. **Database Test Results**
   - Output from `node test-ratings.js`

4. **Screenshots**
   - Dashboard showing rating card
   - Ratings page
   - Any error messages

---

## 🎯 **Expected Behavior**

### **Dashboard:**
```
┌─────────────────────────────────────┐
│ ⭐ Your Rating                      │
│                                     │
│ 5.0          1       ⭐⭐⭐⭐⭐     │
│ Average      Review                 │
│ Rating                              │
│                                     │
│ ⭐ Excellent!                       │
│                                     │
│ [View All Reviews]                  │
└─────────────────────────────────────┘
```

### **Ratings Page:**
```
┌─────────────────────────────────────┐
│ ← My Ratings & Reviews              │
├─────────────┬───────────────────────┤
│ Overall     │ Client Reviews (1)    │
│ Rating      │                       │
│             │ 👤 Grace Zeah         │
│ 5.0         │ ⭐⭐⭐⭐⭐             │
│ ⭐⭐⭐⭐⭐   │ "Excellent work!"     │
│ 1 review    │ [View Assignment]     │
└─────────────┴───────────────────────┘
```

---

**Last Updated:** November 20, 2025  
**Status:** Debugging in progress
