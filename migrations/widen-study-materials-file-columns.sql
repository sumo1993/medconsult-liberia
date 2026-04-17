USE medconsult_liberia;

SET @db_name = DATABASE();

-- Widen file_type to support long MIME types like DOCX.
SET @file_type_len = (
  SELECT COALESCE(CHARACTER_MAXIMUM_LENGTH, 0)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'study_materials'
    AND COLUMN_NAME = 'file_type'
  LIMIT 1
);

SET @sql = IF(@file_type_len > 0 AND @file_type_len < 191,
  'ALTER TABLE study_materials MODIFY COLUMN file_type VARCHAR(191) NULL',
  'SELECT "study_materials.file_type length already sufficient or column missing"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure file_name can safely store long user filenames.
SET @has_file_name = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'study_materials'
    AND COLUMN_NAME = 'file_name'
);

SET @file_name_len = (
  SELECT COALESCE(CHARACTER_MAXIMUM_LENGTH, 0)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'study_materials'
    AND COLUMN_NAME = 'file_name'
  LIMIT 1
);

SET @sql = IF(@has_file_name = 1 AND @file_name_len > 0 AND @file_name_len < 512,
  'ALTER TABLE study_materials MODIFY COLUMN file_name VARCHAR(512) NULL',
  'SELECT "study_materials.file_name length already sufficient or column missing"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
