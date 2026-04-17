USE medconsult_liberia;

SET @stmt = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'profile_photo'
  ),
  'SELECT "users.profile_photo exists" AS status',
  'ALTER TABLE users ADD COLUMN profile_photo LONGBLOB NULL'
);
PREPARE s1 FROM @stmt;
EXECUTE s1;
DEALLOCATE PREPARE s1;

SET @stmt = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'profile_photo_filename'
  ),
  'SELECT "users.profile_photo_filename exists" AS status',
  'ALTER TABLE users ADD COLUMN profile_photo_filename VARCHAR(255) NULL'
);
PREPARE s2 FROM @stmt;
EXECUTE s2;
DEALLOCATE PREPARE s2;

SET @stmt = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'profile_photo_size'
  ),
  'SELECT "users.profile_photo_size exists" AS status',
  'ALTER TABLE users ADD COLUMN profile_photo_size INT NULL'
);
PREPARE s3 FROM @stmt;
EXECUTE s3;
DEALLOCATE PREPARE s3;
