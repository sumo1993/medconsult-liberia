-- Add fields for final submission and client review
ALTER TABLE assignment_requests
ADD COLUMN final_submission_data LONGBLOB COMMENT 'Final completed work file',
ADD COLUMN final_submission_filename VARCHAR(255) COMMENT 'Final work filename',
ADD COLUMN final_submission_size INT COMMENT 'Final work file size',
ADD COLUMN final_submission_type VARCHAR(100) COMMENT 'Final work MIME type',
ADD COLUMN final_submitted_at TIMESTAMP NULL COMMENT 'When final work was submitted',
ADD COLUMN final_submission_notes TEXT COMMENT 'Doctor notes for final submission',
ADD COLUMN client_review_status ENUM('pending', 'accepted', 'rejected') DEFAULT NULL COMMENT 'Client review status',
ADD COLUMN client_review_notes TEXT COMMENT 'Client feedback on final work',
ADD COLUMN client_reviewed_at TIMESTAMP NULL COMMENT 'When client reviewed';
