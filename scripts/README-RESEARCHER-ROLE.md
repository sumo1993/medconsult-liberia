# Adding Researcher Role - Database Update Required

## Problem
You're getting "Failed to update user" error when trying to change a user's role to "researcher" in the Admin Dashboard.

## Root Cause
The `users` table in your database has a `role` column with an ENUM constraint that only includes these values:
- admin
- management
- client
- accountant
- consultant

The new **researcher** role is not in the ENUM list, so the database rejects the update.

## Solution

### Option 1: Run SQL Script (Recommended)
Run the SQL script to update the database:

```bash
mysql -u your_username -p your_database_name < scripts/add-researcher-role.sql
```

Or manually run this SQL command in your database:

```sql
ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'management', 'client', 'accountant', 'consultant', 'researcher') 
NOT NULL DEFAULT 'client';
```

### Option 2: Use Database GUI
If you're using phpMyAdmin, MySQL Workbench, or similar:

1. Open your database
2. Find the `users` table
3. Go to the Structure tab
4. Click "Change" on the `role` column
5. Update the ENUM values to include 'researcher':
   ```
   'admin','management','client','accountant','consultant','researcher'
   ```
6. Save the changes

### Option 3: Check if VARCHAR
If your `role` column is VARCHAR (not ENUM), then the database update is not needed. The error might be something else. Check the server logs for more details.

## After Database Update

Once the database is updated, you can:

1. Go to Admin Dashboard → Users
2. Edit any user
3. Select "Researcher" from the Role dropdown
4. Save successfully

## Update Existing User

To change the existing user (429319lr@gmail.com) to researcher role:

```sql
UPDATE users 
SET role = 'researcher' 
WHERE email = '429319lr@gmail.com';
```

## Verify the Change

Check if the role was updated successfully:

```sql
SELECT id, email, full_name, role 
FROM users 
WHERE email = '429319lr@gmail.com';
```

## Notes

- All code changes have been completed
- Only the database schema needs updating
- After updating the database, the error will be resolved
- Users with 'researcher' role will access the consultant dashboard
- Team applications will automatically create users with 'researcher' role
