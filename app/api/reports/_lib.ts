import pool, { IS_POSTGRES } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export type ReportRole = 'census' | 'researcher';
export type SurveyType =
  | 'malaria'
  | 'health'
  | 'maternal_child_health'
  | 'wash'
  | 'nutrition'
  | 'outbreak'; // legacy non-malaria type kept for backward compatibility
export const NON_MALARIA_SURVEY_TYPES: SurveyType[] = ['health', 'maternal_child_health', 'wash', 'nutrition'];

export type ReportRecord = RowDataPacket & {
  id: number;
  user_id: number;
  collector_name: string;
  collector_email: string;
  date_of_visit: string;
  county: string;
  district: string | null;
  community: string;
  electoral_district: string | null;
  households_surveyed: number;
  malaria_cases: number;
  fever_cases: number;
  children_under_5: number;
  pregnant_women: number;
  notes: string | null;
  /** Optional village / landmark description when GPS or geocode is unreliable (e.g. low connectivity). */
  location_landmark: string | null;
  correction_note: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  is_urgent: boolean;
  status: string;
  survey_type: SurveyType;
  data: Record<string, unknown> | null;
  census_assignment_id?: number | null;
  created_at: string;
  updated_at: string;
};

let ensureReportsTablePromise: Promise<void> | null = null;

export async function ensureReportsTable() {
  if (ensureReportsTablePromise) {
    await ensureReportsTablePromise;
    return;
  }

  ensureReportsTablePromise = (async () => {
    let createdOrVerified = false;
    if (!IS_POSTGRES) {
      try {
        await pool.execute(`
          CREATE TABLE IF NOT EXISTS reports (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            date_of_visit DATE NOT NULL,
            county VARCHAR(120) NOT NULL,
            district VARCHAR(120) NULL,
            community VARCHAR(160) NOT NULL,
            households_surveyed INT NOT NULL DEFAULT 0,
            malaria_cases INT NOT NULL DEFAULT 0,
            fever_cases INT NOT NULL DEFAULT 0,
            children_under_5 INT NOT NULL DEFAULT 0,
            pregnant_women INT NOT NULL DEFAULT 0,
            notes TEXT NULL,
            correction_note TEXT NULL,
            gps_lat DECIMAL(10, 7) NULL,
            gps_lng DECIMAL(10, 7) NULL,
            is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
            status VARCHAR(20) NOT NULL DEFAULT 'submitted',
            survey_type VARCHAR(32) NOT NULL DEFAULT 'malaria',
            data JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_reports_user_id (user_id),
            INDEX idx_reports_user_date_community (user_id, date_of_visit, community),
            INDEX idx_reports_county (county),
            INDEX idx_reports_date_of_visit (date_of_visit),
            INDEX idx_reports_district (district),
            INDEX idx_reports_created_at (created_at),
            INDEX idx_reports_is_urgent (is_urgent),
            INDEX idx_reports_status (status),
            INDEX idx_reports_survey_type (survey_type)
          )
        `);
        createdOrVerified = true;
      } catch (mysqlError) {
        console.error('Failed ensuring reports table (mysql):', mysqlError);
        throw mysqlError;
      }
    } else {
      try {
        await pool.execute(`
          CREATE TABLE IF NOT EXISTS reports (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            date_of_visit DATE NOT NULL,
            county VARCHAR(120) NOT NULL,
            district VARCHAR(120),
            community VARCHAR(160) NOT NULL,
            households_surveyed INTEGER NOT NULL DEFAULT 0,
            malaria_cases INTEGER NOT NULL DEFAULT 0,
            fever_cases INTEGER NOT NULL DEFAULT 0,
            children_under_5 INTEGER NOT NULL DEFAULT 0,
            pregnant_women INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            correction_note TEXT,
            gps_lat NUMERIC(10, 7),
            gps_lng NUMERIC(10, 7),
            is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
            status VARCHAR(20) NOT NULL DEFAULT 'submitted',
            survey_type VARCHAR(32) NOT NULL DEFAULT 'malaria',
            data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        try { await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id)`); } catch {}
        try { await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_user_date_community ON reports(user_id, date_of_visit, community)`); } catch {}
        try { await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_county ON reports(county)`); } catch {}
        try { await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_date_of_visit ON reports(date_of_visit)`); } catch {}
        try { await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_district ON reports(district)`); } catch {}
        try { await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at)`); } catch {}
        try { await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_is_urgent ON reports(is_urgent)`); } catch {}
        try { await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)`); } catch {}
        try { await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_survey_type ON reports(survey_type)`); } catch {}
        createdOrVerified = true;
      } catch (pgError) {
        console.error('Failed ensuring reports table (postgres):', pgError);
        throw pgError;
      }
    }

    if (!createdOrVerified) return;

    // Compatibility migration for older deployed tables.
    // Run idempotent DDL in both PG and MySQL variants so whichever dialect is
    // active can apply missing columns/indexes without relying on metadata reads.
    try {
      try {
        await pool.execute(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS date_of_visit DATE`);
      } catch {
        try {
          await pool.execute(`ALTER TABLE reports ADD COLUMN date_of_visit DATE`);
        } catch {
          // already exists or unsupported syntax in current dialect
        }
      }

      await pool.execute(`UPDATE reports SET date_of_visit = DATE(created_at) WHERE date_of_visit IS NULL`);

      try {
        await pool.execute(`ALTER TABLE reports ALTER COLUMN date_of_visit SET NOT NULL`);
      } catch {
        try {
          await pool.execute(`ALTER TABLE reports MODIFY COLUMN date_of_visit DATE NOT NULL`);
        } catch {
          // leave nullable if dialect cannot alter directly
        }
      }

      try {
        await pool.execute(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS households_surveyed INTEGER NOT NULL DEFAULT 0`);
      } catch {
        try {
          await pool.execute(`ALTER TABLE reports ADD COLUMN households_surveyed INT NOT NULL DEFAULT 0`);
        } catch {
          // already exists or unsupported syntax in current dialect
        }
      }

      try {
        await pool.execute(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS correction_note TEXT`);
      } catch {
        try {
          await pool.execute(`ALTER TABLE reports ADD COLUMN correction_note TEXT`);
        } catch {
          // already exists or unsupported syntax in current dialect
        }
      }

      try {
        await pool.execute(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS survey_type VARCHAR(32)`);
      } catch {
        try {
          await pool.execute(`ALTER TABLE reports ADD COLUMN survey_type VARCHAR(32)`);
        } catch {
          // already exists or unsupported syntax in current dialect
        }
      }
      await pool.execute(`UPDATE reports SET survey_type = 'malaria' WHERE survey_type IS NULL OR survey_type = ''`);
      try {
        await pool.execute(`ALTER TABLE reports ALTER COLUMN survey_type SET NOT NULL`);
      } catch {
        try {
          await pool.execute(`ALTER TABLE reports MODIFY COLUMN survey_type VARCHAR(32) NOT NULL DEFAULT 'malaria'`);
        } catch {
          // leave nullable if dialect cannot alter directly
        }
      }

      try {
        await pool.execute(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS data JSONB`);
      } catch {
        try {
          await pool.execute(`ALTER TABLE reports ADD COLUMN data JSON`);
        } catch {
          // already exists or unsupported syntax in current dialect
        }
      }

      try {
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_user_date_community ON reports(user_id, date_of_visit, community)`);
      } catch {
        // MySQL may not support IF NOT EXISTS for indexes
      }
      try {
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_survey_type ON reports(survey_type)`);
      } catch {
        // MySQL may not support IF NOT EXISTS for indexes
      }
      try {
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_county ON reports(county)`);
      } catch {
        // MySQL may not support IF NOT EXISTS for indexes
      }
      try {
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_date_of_visit ON reports(date_of_visit)`);
      } catch {
        // MySQL may not support IF NOT EXISTS for indexes
      }
      try {
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_is_urgent ON reports(is_urgent)`);
      } catch {
        // MySQL may not support IF NOT EXISTS for indexes
      }

      try {
        await pool.execute(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS census_assignment_id INTEGER`);
      } catch {
        try {
          await pool.execute(`ALTER TABLE reports ADD COLUMN census_assignment_id INT NULL`);
        } catch {
          // already exists
        }
      }
      try {
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_census_assignment ON reports(census_assignment_id)`);
      } catch {
        // ignore
      }
      try {
        await pool.execute(`CREATE INDEX IF NOT EXISTS idx_reports_user_created ON reports(user_id, created_at)`);
      } catch {
        try {
          await pool.execute(`CREATE INDEX idx_reports_user_created ON reports(user_id, created_at)`);
        } catch {
          /* exists */
        }
      }
      try {
        await pool.execute(
          `CREATE INDEX IF NOT EXISTS idx_reports_visit_status ON reports(date_of_visit, status)`
        );
      } catch {
        try {
          await pool.execute(`CREATE INDEX idx_reports_visit_status ON reports(date_of_visit, status)`);
        } catch {
          /* exists */
        }
      }

      try {
        await pool.execute(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS hidden_from_submitter BOOLEAN NOT NULL DEFAULT FALSE`);
      } catch {
        try {
          await pool.execute(`ALTER TABLE reports ADD COLUMN hidden_from_submitter TINYINT(1) NOT NULL DEFAULT 0`);
        } catch {
          /* exists */
        }
      }

      try {
        await pool.execute(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS location_landmark TEXT`);
      } catch {
        try {
          await pool.execute(`ALTER TABLE reports ADD COLUMN location_landmark TEXT NULL`);
        } catch {
          /* exists */
        }
      }

      try {
        await pool.execute(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS electoral_district VARCHAR(120)`);
      } catch {
        try {
          await pool.execute(`ALTER TABLE reports ADD COLUMN electoral_district VARCHAR(120) NULL`);
        } catch {
          /* exists */
        }
      }
    } catch (compatError) {
      console.warn('reports compatibility migration skipped:', compatError);
    }
  })();

  try {
    await ensureReportsTablePromise;
  } catch (error) {
    ensureReportsTablePromise = null;
    throw error;
  }
}

export function toNonNegativeInt(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseBool(value: string | null): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes'].includes(normalized)) return true;
  if (['0', 'false', 'no'].includes(normalized)) return false;
  return null;
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
