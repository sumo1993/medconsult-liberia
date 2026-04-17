import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { censusFieldAccessDeniedResponse } from '@/lib/census-field-access';

const SUPPORTED_SURVEYS = ['malaria', 'health', 'maternal_child_health', 'wash', 'nutrition'] as const;
type SupportedSurvey = (typeof SUPPORTED_SURVEYS)[number];

let ensureSurveyLocksPromise: Promise<void> | null = null;

async function ensureSurveyLocksTable() {
  if (ensureSurveyLocksPromise) {
    await ensureSurveyLocksPromise;
    return;
  }

  ensureSurveyLocksPromise = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_survey_locks (
          survey_type VARCHAR(32) PRIMARY KEY,
          is_locked BOOLEAN NOT NULL DEFAULT FALSE,
          updated_by INTEGER,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      for (const surveyType of SUPPORTED_SURVEYS) {
        await pool.execute(
          `INSERT INTO census_survey_locks (survey_type, is_locked)
           VALUES (?, FALSE)
           ON CONFLICT (survey_type) DO NOTHING`,
          [surveyType]
        );
      }
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_survey_locks (
          survey_type VARCHAR(32) PRIMARY KEY,
          is_locked BOOLEAN NOT NULL DEFAULT FALSE,
          updated_by INT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      for (const surveyType of SUPPORTED_SURVEYS) {
        await pool.execute(
          `INSERT IGNORE INTO census_survey_locks (survey_type, is_locked)
           VALUES (?, FALSE)`,
          [surveyType]
        );
      }
    }
  })();

  try {
    await ensureSurveyLocksPromise;
  } catch (error) {
    ensureSurveyLocksPromise = null;
    throw error;
  }
}

type SurveyLockRow = RowDataPacket & {
  survey_type: SupportedSurvey;
  is_locked: boolean | number;
  updated_at: string;
};

export async function GET(request: NextRequest) {
  try {
    await ensureSurveyLocksTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['researcher', 'census', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (user.role === 'census') {
      const fieldDenied = await censusFieldAccessDeniedResponse(user);
      if (fieldDenied) return fieldDenied;
    }

    const [rows] = await pool.execute<SurveyLockRow[]>(
      `SELECT survey_type, is_locked, updated_at
       FROM census_survey_locks
       ORDER BY survey_type ASC`
    );
    const locks = SUPPORTED_SURVEYS.reduce<Record<string, boolean>>((acc, surveyType) => {
      const row = rows.find((item) => String(item.survey_type) === surveyType);
      acc[surveyType] = Boolean(row ? Number(row.is_locked) : false);
      return acc;
    }, {});

    return NextResponse.json({ locks, rows });
  } catch (error) {
    console.error('Error fetching survey locks:', error);
    return NextResponse.json({ error: 'Failed to fetch survey locks' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureSurveyLocksTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const surveyType = String(body?.survey_type || '').trim().toLowerCase();
    const isLocked = Boolean(body?.is_locked);
    if (!SUPPORTED_SURVEYS.includes(surveyType as SupportedSurvey)) {
      return NextResponse.json({ error: 'Invalid survey_type' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE census_survey_locks
       SET is_locked = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE survey_type = ?`,
      [isLocked, user.userId, surveyType]
    );

    return NextResponse.json({ success: true, survey_type: surveyType, is_locked: isLocked });
  } catch (error) {
    console.error('Error updating survey lock:', error);
    return NextResponse.json({ error: 'Failed to update survey lock' }, { status: 500 });
  }
}

