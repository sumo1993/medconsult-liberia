-- Add fields for work submission to assignment_requests table
ALTER TABLE assignment_requests
ADD COLUMN work_file_data LONGBLOB COMMENT 'Submitted work file',
ADD COLUMN work_filename VARCHAR(255) COMMENT 'Original filename of submitted work',
ADD COLUMN work_file_size INT COMMENT 'File size in bytes',
ADD COLUMN work_file_type VARCHAR(100) COMMENT 'MIME type of file',
ADD COLUMN work_submitted_at TIMESTAMP NULL COMMENT 'When work was submitted',
ADD COLUMN work_notes TEXT COMMENT 'Notes from doctor about the submission';
