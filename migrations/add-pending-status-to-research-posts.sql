USE medconsult_liberia;

-- Consultant/Researcher "Submit for review" writes status='pending'.
-- Keep existing states and add pending for approval workflow.
ALTER TABLE research_posts
MODIFY COLUMN status ENUM('draft', 'pending', 'published', 'archived') DEFAULT 'draft';
