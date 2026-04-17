USE medconsult_liberia;

ALTER TABLE direct_messages
  ADD COLUMN IF NOT EXISTS reply_to_id INT NULL,
  ADD COLUMN IF NOT EXISTS reactions JSON NULL,
  ADD COLUMN IF NOT EXISTS edited_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE direct_messages
  ADD CONSTRAINT fk_direct_messages_reply
  FOREIGN KEY (reply_to_id) REFERENCES direct_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_direct_messages_reply_to_id ON direct_messages (reply_to_id);
