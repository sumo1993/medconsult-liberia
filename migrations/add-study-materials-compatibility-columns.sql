USE medconsult_liberia;

SET @db_name = DATABASE();

SET @has = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'study_materials' AND COLUMN_NAME = 'file_name'
);
SET @sql = IF(@has = 0,
  'ALTER TABLE study_materials ADD COLUMN file_name VARCHAR(255) NULL AFTER description',
  'SELECT "study_materials.file_name exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'study_materials' AND COLUMN_NAME = 'file_path'
);
SET @sql = IF(@has = 0,
  'ALTER TABLE study_materials ADD COLUMN file_path VARCHAR(1000) NULL AFTER file_name',
  'SELECT "study_materials.file_path exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'study_materials' AND COLUMN_NAME = 'file_size'
);
SET @sql = IF(@has = 0,
  'ALTER TABLE study_materials ADD COLUMN file_size BIGINT NULL AFTER file_type',
  'SELECT "study_materials.file_size exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'study_materials' AND COLUMN_NAME = 'upload_date'
);
SET @sql = IF(@has = 0,
  'ALTER TABLE study_materials ADD COLUMN upload_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER uploaded_by',
  'SELECT "study_materials.upload_date exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill compatibility columns from legacy schema.
UPDATE study_materials
SET file_path = COALESCE(file_path, file_url)
WHERE file_path IS NULL AND file_url IS NOT NULL;

UPDATE study_materials
SET file_name = COALESCE(file_name, SUBSTRING_INDEX(file_path, '/', -1), title)
WHERE file_name IS NULL;

UPDATE study_materials
SET file_size = COALESCE(file_size, 0)
WHERE file_size IS NULL;

UPDATE study_materials
SET upload_date = COALESCE(upload_date, created_at, CURRENT_TIMESTAMP)
WHERE upload_date IS NULL;
