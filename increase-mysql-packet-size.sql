-- Increase MySQL max_allowed_packet size for large content
-- Run this if you're getting "Packet too large" errors

-- Check current setting
SHOW VARIABLES LIKE 'max_allowed_packet';

-- Increase to 64MB (adjust as needed)
SET GLOBAL max_allowed_packet=67108864;

-- Verify the change
SHOW VARIABLES LIKE 'max_allowed_packet';

-- Note: This change is temporary and will reset on MySQL restart
-- To make it permanent, add this to your MySQL config file (my.cnf or my.ini):
-- [mysqld]
-- max_allowed_packet=64M
