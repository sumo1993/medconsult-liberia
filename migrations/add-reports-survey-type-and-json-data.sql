-- Add flexible survey support without breaking existing malaria records.
-- PostgreSQL-oriented migration.

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS survey_type VARCHAR(32);

UPDATE reports
SET survey_type = 'malaria'
WHERE survey_type IS NULL OR survey_type = '';

ALTER TABLE reports
  ALTER COLUMN survey_type SET DEFAULT 'malaria';

ALTER TABLE reports
  ALTER COLUMN survey_type SET NOT NULL;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS data JSONB;

CREATE INDEX IF NOT EXISTS idx_reports_survey_type ON reports(survey_type);
CREATE INDEX IF NOT EXISTS idx_reports_user_date_community ON reports(user_id, date_of_visit, community);
