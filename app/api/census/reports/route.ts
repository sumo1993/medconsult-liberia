import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import { censusFieldAccessDeniedResponse } from '@/lib/census-field-access';

type CensusReportRow = RowDataPacket & {
  id: number;
  worker_id: number;
  worker_name: string;
  worker_email: string;
  report_date: string;
  county: string;
  district: string | null;
  community: string;
  malaria_cases: number;
  fever_cases: number;
  other_cases: number;
  households_visited: number;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  status: 'submitted' | 'reviewed';
  reviewer_id: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

async function ensureCensusReportsTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS census_reports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        worker_id INT NOT NULL,
        report_date DATE NOT NULL,
        county VARCHAR(120) NOT NULL,
        district VARCHAR(120) NULL,
        community VARCHAR(160) NOT NULL,
        malaria_cases INT NOT NULL DEFAULT 0,
        fever_cases INT NOT NULL DEFAULT 0,
        other_cases INT NOT NULL DEFAULT 0,
        households_visited INT NOT NULL DEFAULT 0,
        notes TEXT NULL,
        latitude DECIMAL(10, 7) NULL,
        longitude DECIMAL(10, 7) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'submitted',
        reviewer_id INT NULL,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_worker_id (worker_id),
        INDEX idx_report_date (report_date),
        INDEX idx_status (status)
      )
    `);
    return;
  } catch (mysqlError) {
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS census_reports (
          id SERIAL PRIMARY KEY,
          worker_id INTEGER NOT NULL,
          report_date DATE NOT NULL,
          county VARCHAR(120) NOT NULL,
          district VARCHAR(120),
          community VARCHAR(160) NOT NULL,
          malaria_cases INTEGER NOT NULL DEFAULT 0,
          fever_cases INTEGER NOT NULL DEFAULT 0,
          other_cases INTEGER NOT NULL DEFAULT 0,
          households_visited INTEGER NOT NULL DEFAULT 0,
          notes TEXT,
          latitude NUMERIC(10, 7),
          longitude NUMERIC(10, 7),
          status VARCHAR(20) NOT NULL DEFAULT 'submitted',
          reviewer_id INTEGER,
          reviewed_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_census_reports_worker_id ON census_reports(worker_id)`);
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_census_reports_report_date ON census_reports(report_date)`);
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_census_reports_status ON census_reports(status)`);
      return;
    } catch (pgError) {
      console.error('Failed ensuring census_reports table (mysql + pg):', mysqlError, pgError);
      throw pgError;
    }
  }
}

function toNonNegativeInt(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: NextRequest) {
  try {
    await ensureCensusReportsTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['census', 'researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (user.role === 'census') {
      const fieldDenied = await censusFieldAccessDeniedResponse(user);
      if (fieldDenied) return fieldDenied;
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'mine';
    const status = searchParams.get('status');

    let where = 'WHERE 1=1';
    const params: unknown[] = [];

    if (user.role === 'census' || scope !== 'all') {
      where += ' AND cr.worker_id = ?';
      params.push(user.userId);
    }
    if (status && (status === 'submitted' || status === 'reviewed')) {
      where += ' AND cr.status = ?';
      params.push(status);
    }

    const [reports] = await pool.execute<CensusReportRow[]>(
      `SELECT
        cr.id,
        cr.worker_id,
        COALESCE(u.full_name, 'Field Worker') AS worker_name,
        COALESCE(u.email, '') AS worker_email,
        cr.report_date,
        cr.county,
        cr.district,
        cr.community,
        cr.malaria_cases,
        cr.fever_cases,
        cr.other_cases,
        cr.households_visited,
        cr.notes,
        cr.latitude,
        cr.longitude,
        cr.status,
        cr.reviewer_id,
        cr.reviewed_at,
        cr.created_at,
        cr.updated_at
      FROM census_reports cr
      LEFT JOIN users u ON cr.worker_id = u.id
      ${where}
      ORDER BY cr.report_date DESC, cr.created_at DESC, cr.id DESC`,
      params
    );

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching census reports:', error);
    return NextResponse.json({ error: 'Failed to fetch census reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCensusReportsTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['census', 'researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (user.role === 'census') {
      const fieldDenied = await censusFieldAccessDeniedResponse(user);
      if (fieldDenied) return fieldDenied;
    }

    const body = await request.json();
    const reportDate = String(body?.report_date || '').trim();
    const county = String(body?.county || '').trim();
    const district = String(body?.district || '').trim();
    const community = String(body?.community || '').trim();

    if (!reportDate || !county || !community) {
      return NextResponse.json({ error: 'Report date, county and community are required' }, { status: 400 });
    }

    const malariaCases = toNonNegativeInt(body?.malaria_cases);
    const feverCases = toNonNegativeInt(body?.fever_cases);
    const otherCases = toNonNegativeInt(body?.other_cases);
    const householdsVisited = toNonNegativeInt(body?.households_visited);
    const notes = String(body?.notes || '').trim();
    const latitude = toNullableNumber(body?.latitude);
    const longitude = toNullableNumber(body?.longitude);

    const [result] = await pool.execute(
      `INSERT INTO census_reports
        (worker_id, report_date, county, district, community, malaria_cases, fever_cases, other_cases, households_visited, notes, latitude, longitude, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        user.userId,
        reportDate,
        county,
        district || null,
        community,
        malariaCases,
        feverCases,
        otherCases,
        householdsVisited,
        notes || null,
        latitude,
        longitude,
      ]
    );

    const insertId = Number((result as { insertId?: number }).insertId || 0);
    return NextResponse.json({ success: true, id: insertId }, { status: 201 });
  } catch (error) {
    console.error('Error creating census report:', error);
    return NextResponse.json({ error: 'Failed to save census report' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureCensusReportsTable();
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['researcher', 'admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const reportId = Number(body?.id);
    const status = String(body?.status || '').trim();
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
    }
    if (!['submitted', 'reviewed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE census_reports
       SET status = ?, reviewer_id = ?, reviewed_at = CASE WHEN ? = 'reviewed' THEN CURRENT_TIMESTAMP ELSE NULL END, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, user.userId, status, reportId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating census report status:', error);
    return NextResponse.json({ error: 'Failed to update report status' }, { status: 500 });
  }
}

