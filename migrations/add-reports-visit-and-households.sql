-- Reports schema hardening for field census workflow
-- Works for PostgreSQL. For MySQL, use equivalent ALTER statements.

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS date_of_visit DATE;

UPDATE reports
SET date_of_visit = DATE(created_at)
WHERE date_of_visit IS NULL;

ALTER TABLE reports
ALTER COLUMN date_of_visit SET NOT NULL;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS households_surveyed INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_reports_county ON reports(county);
CREATE INDEX IF NOT EXISTS idx_reports_date_of_visit ON reports(date_of_visit);
CREATE INDEX IF NOT EXISTS idx_reports_is_urgent ON reports(is_urgent);

