USE medconsult_liberia;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_change_locked TINYINT(1) NOT NULL DEFAULT 0;
