-- Add file attachment support to assignment messages
ALTER TABLE assignment_messages
ADD COLUMN attachment_data LONGBLOB,
ADD COLUMN attachment_filename VARCHAR(255),
ADD COLUMN attachment_size INT,
ADD COLUMN attachment_type VARCHAR(100);
