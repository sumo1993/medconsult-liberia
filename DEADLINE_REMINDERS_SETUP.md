# Deadline Reminders System - Setup Guide

## ✅ What's Implemented

The deadline reminders system automatically:
- Sends reminders 24 hours before deadline
- Notifies about overdue assignments
- Creates in-app messages
- Tracks sent reminders to avoid duplicates

---

## 🚀 Setup Instructions

### 1. Environment Variable

Add to your `.env` file:
```env
CRON_SECRET=your-secure-random-string-here
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Cron Job Setup

Choose one of these methods:

#### Option A: Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/deadline-reminders",
    "schedule": "0 * * * *"
  }]
}
```

This runs every hour.

#### Option B: GitHub Actions

Create `.github/workflows/deadline-reminders.yml`:
```yaml
name: Deadline Reminders
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Manual trigger

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Call deadline reminders endpoint
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/deadline-reminders
```

#### Option C: External Cron Service

Use services like:
- **cron-job.org** (free)
- **EasyCron** (free tier available)
- **Cronitor**

Configure:
- URL: `https://your-domain.com/api/cron/deadline-reminders`
- Method: GET
- Header: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: Every hour (`0 * * * *`)

#### Option D: Server Cron (Linux/Mac)

```bash
crontab -e
```

Add:
```bash
0 * * * * curl -X GET -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/deadline-reminders
```

---

## 📊 How It Works

### Reminder Logic

1. **24-Hour Reminder**
   - Checks assignments with deadlines in next 24 hours
   - Only for `in_progress` or `payment_verified` status
   - Sends once per assignment
   - Creates in-app message

2. **Overdue Notification**
   - Checks assignments past deadline
   - Only for incomplete assignments
   - Sends urgent notification
   - Marks as overdue

### Message Format

**24-Hour Reminder:**
```
⏰ Deadline Reminder: Assignment "Title" is due in X hours!
```

**Overdue:**
```
🚨 OVERDUE: Assignment "Title" has passed its deadline. Please submit as soon as possible.
```

---

## 🧪 Testing

### Manual Test

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/deadline-reminders
```

Expected response:
```json
{
  "success": true,
  "reminders": 2,
  "overdueNotifications": 1,
  "details": {
    "upcomingDeadlines": [...],
    "overdueAssignments": [...]
  }
}
```

### Create Test Assignment

```sql
-- Create assignment with deadline in 23 hours
INSERT INTO assignment_requests (
  client_id, title, subject, description, 
  deadline, status, doctor_id
) VALUES (
  1, 'Test Assignment', 'Test', 'Testing reminders',
  DATE_ADD(NOW(), INTERVAL 23 HOUR), 'in_progress', 2
);
```

---

## 📧 Email Integration (Optional)

To add email notifications, modify `/app/api/cron/deadline-reminders/route.ts`:

```typescript
// Add email sending
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// In the reminder loop:
await transporter.sendMail({
  from: 'noreply@medconsult.com',
  to: assignment.doctor_email,
  subject: `Deadline Reminder: ${assignment.title}`,
  html: `
    <h2>Deadline Reminder</h2>
    <p>Your assignment "${assignment.title}" is due in ${hoursUntilDeadline} hours.</p>
    <p><a href="https://your-domain.com/dashboard/management/assignment-requests/${assignment.id}">View Assignment</a></p>
  `,
});
```

---

## 🔍 Monitoring

### Check Reminder Status

```sql
-- See which assignments have reminders sent
SELECT id, title, deadline, 
       deadline_reminder_sent, 
       overdue_notification_sent
FROM assignment_requests
WHERE deadline IS NOT NULL
ORDER BY deadline DESC;
```

### Reset Reminders (for testing)

```sql
UPDATE assignment_requests 
SET deadline_reminder_sent = 0, 
    overdue_notification_sent = 0
WHERE id = YOUR_ASSIGNMENT_ID;
```

---

## 🎯 Customization

### Change Reminder Timing

Edit `/app/api/cron/deadline-reminders/route.ts`:

```typescript
// For 48-hour reminder instead of 24:
const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
```

### Add Multiple Reminders

Add more reminder columns:
```sql
ALTER TABLE assignment_requests 
ADD COLUMN reminder_48h_sent TINYINT(1) DEFAULT 0,
ADD COLUMN reminder_12h_sent TINYINT(1) DEFAULT 0;
```

---

## ✅ Verification Checklist

- [ ] Database columns added
- [ ] CRON_SECRET set in environment
- [ ] Cron job configured and running
- [ ] Test reminder sent successfully
- [ ] In-app messages appearing
- [ ] Email notifications working (if configured)
- [ ] Monitoring in place

---

## 🚨 Troubleshooting

**Reminders not sending?**
- Check cron job is running
- Verify CRON_SECRET matches
- Check server logs
- Ensure assignments have deadlines set

**Duplicate reminders?**
- Check `deadline_reminder_sent` column
- Verify cron isn't running too frequently

**No in-app messages?**
- Check `assignment_messages` table
- Verify message refresh interval

---

## 📈 Future Enhancements

- [ ] Email notifications
- [ ] SMS notifications
- [ ] Customizable reminder times
- [ ] Multiple reminder intervals
- [ ] Escalation to admin
- [ ] Deadline extension requests
- [ ] Auto-cancel overdue assignments

---

**Status:** ✅ Ready for Production  
**Last Updated:** November 20, 2025
