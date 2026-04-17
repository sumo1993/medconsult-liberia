USE medconsult_liberia;

SET @db_name = DATABASE();

SET @has = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'research_posts' AND COLUMN_NAME = 'pdf_file'
);
SET @sql = IF(@has = 0,
  'ALTER TABLE research_posts ADD COLUMN pdf_file LONGBLOB NULL AFTER pdf_data',
  'SELECT "research_posts.pdf_file exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'research_posts' AND COLUMN_NAME = 'featured_image'
);
SET @sql = IF(@has = 0,
  'ALTER TABLE research_posts ADD COLUMN featured_image LONGBLOB NULL AFTER pdf_type',
  'SELECT "research_posts.featured_image exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'research_posts' AND COLUMN_NAME = 'featured_image_filename'
);
SET @sql = IF(@has = 0,
  'ALTER TABLE research_posts ADD COLUMN featured_image_filename VARCHAR(255) NULL AFTER featured_image',
  'SELECT "research_posts.featured_image_filename exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'research_posts' AND COLUMN_NAME = 'featured_image_size'
);
SET @sql = IF(@has = 0,
  'ALTER TABLE research_posts ADD COLUMN featured_image_size INT NULL AFTER featured_image_filename',
  'SELECT "research_posts.featured_image_size exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill between legacy and newer PDF storage columns for compatibility.
UPDATE research_posts
SET pdf_file = pdf_data
WHERE pdf_file IS NULL AND pdf_data IS NOT NULL;

UPDATE research_posts
SET pdf_data = pdf_file
WHERE pdf_data IS NULL AND pdf_file IS NOT NULL;
