-- Allow NULL consultant_id for team-only distributions (partnerships, grants, etc.)
ALTER TABLE consultant_earnings 
MODIFY COLUMN consultant_id INT NULL;
