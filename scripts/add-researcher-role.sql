-- ============================================
-- Add 'researcher' role to MedConsult Liberia
-- ============================================

-- Step 1: Check current role values
SELECT 'Current roles in database:' AS info;
SELECT DISTINCT role FROM users;

-- Step 2: Modify the role column to include 'researcher'
SELECT 'Adding researcher role to ENUM...' AS info;
ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'management', 'client', 'accountant', 'consultant', 'researcher') 
NOT NULL DEFAULT 'client';

-- Step 3: Verify the change
SELECT 'Verifying role column structure:' AS info;
SHOW COLUMNS FROM users LIKE 'role';

-- Step 4: Update the specific user to researcher role
SELECT 'Updating user 429319lr@gmail.com to researcher role...' AS info;
UPDATE users 
SET role = 'researcher' 
WHERE email = '429319lr@gmail.com';

-- Step 5: Verify the user was updated
SELECT 'Verifying user update:' AS info;
SELECT id, email, full_name, role, status 
FROM users 
WHERE email = '429319lr@gmail.com';

-- Step 6: Show all researchers
SELECT 'All users with researcher role:' AS info;
SELECT id, email, full_name, role, created_at 
FROM users 
WHERE role = 'researcher';

SELECT 'Script completed successfully!' AS info;
