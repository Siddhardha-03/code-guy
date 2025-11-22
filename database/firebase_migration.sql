-- Firebase Authentication Migration Script
-- This script prepares the users table for Firebase integration

-- Step 1: Add firebase_uid column (already exists based on your schema)
-- Skip if already exists

-- Step 2: Ensure email_verified column exists
-- (already exists based on your schema)

-- Step 3: Make password nullable (since Firebase manages passwords)
ALTER TABLE users MODIFY COLUMN password TEXT NULL;

-- Step 4: Add index on firebase_uid for faster lookups
-- (UNIQUE constraint already exists based on your schema)

-- Step 5: Optional - Add last_signed_in update trigger
-- This can help track user activity

-- Verification queries
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'users'
AND COLUMN_NAME IN ('firebase_uid', 'email_verified', 'password')
ORDER BY ORDINAL_POSITION;

-- Sample query to check current state
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN firebase_uid IS NOT NULL THEN 1 ELSE 0 END) as firebase_users,
    SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) as verified_users
FROM users;
