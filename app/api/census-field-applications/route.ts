import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES, query } from '@/lib/db';
import { ensureCensusFieldApplicationsTable } from '@/lib/ensure-census-field-applications-table';
import { verifyAuth } from '@/lib/middleware';
import { sendApplicantEmail } from '@/lib/send-applicant-email';
import { createUser } from '@/lib/auth';
import {
  sendCensusFieldAdminNotification,
  sendCensusFieldApplicationReceivedEmail,
} from '@/lib/email';
import { CENSUS_FIELD_TEXT_MIN_LENGTH } from '@/lib/census-field-application-validation';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function notifyAdminsAndApplicant(data: {
  fullName: string;
  email: string;
  phone: string;
  preferredRegion: string;
}) {
  try {
    const adminUsers = (await query(
      "SELECT email FROM users WHERE role IN ('admin', 'management') AND status = 'active'"
    )) as { email: string }[];
    const to = adminUsers?.map((u) => u.email).filter(Boolean).join(', ') || '';
    if (to) {
      await sendCensusFieldAdminNotification(to, data);
    }
  } catch (e) {
    console.error('[census-field-applications] notify admins:', e);
  }
  try {
    await sendCensusFieldApplicationReceivedEmail(data.email, data.fullName, data.preferredRegion);
  } catch (e) {
    console.error('[census-field-applications] applicant confirmation:', e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCensusFieldApplicationsTable();
    const data = await request.json();
    const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
    const preferredRegion = typeof data.preferredRegion === 'string' ? data.preferredRegion.trim() : '';
    const fieldExperience = typeof data.fieldExperience === 'string' ? data.fieldExperience.trim() : '';
    const motivation = typeof data.motivation === 'string' ? data.motivation.trim() : '';

    if (!fullName || !email || !phone || !preferredRegion || !fieldExperience || !motivation) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (
      fieldExperience.length < CENSUS_FIELD_TEXT_MIN_LENGTH ||
      motivation.length < CENSUS_FIELD_TEXT_MIN_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Experience and motivation must each be at least ${CENSUS_FIELD_TEXT_MIN_LENGTH} characters (after spaces are trimmed).`,
        },
        { status: 400 }
      );
    }

    const params = [fullName, email, phone, preferredRegion, fieldExperience, motivation];
    let applicationId = 0;

    if (IS_POSTGRES) {
      const [rows] = await pool.execute<{ id: number }[]>(
        `INSERT INTO census_field_applications
          (full_name, email, phone, preferred_region, field_experience, motivation)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
        params
      );
      applicationId = Number(rows[0]?.id ?? 0);
    } else {
      const [insertResult] = await pool.execute(
        `INSERT INTO census_field_applications
          (full_name, email, phone, preferred_region, field_experience, motivation)
         VALUES (?, ?, ?, ?, ?, ?)`,
        params
      );
      applicationId = Number((insertResult as { insertId?: number }).insertId ?? 0);
    }

    void notifyAdminsAndApplicant({
      fullName,
      email,
      phone,
      preferredRegion,
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId,
    });
  } catch (error) {
    console.error('census-field-applications POST', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureCensusFieldApplicationsTable();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let sql = `
      SELECT id, full_name, email, phone, preferred_region, field_experience, motivation,
             status, admin_notes, created_at, reviewed_at
      FROM census_field_applications`;
    const params: unknown[] = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';

    const rows = await query(sql, params);
    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    console.error('census-field-applications GET', e);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureCensusFieldApplicationsTable();
    const body = await request.json();
    const { applicationId, status, adminNotes } = body;

    const apps = (await query('SELECT * FROM census_field_applications WHERE id = ?', [applicationId])) as Record<
      string,
      unknown
    >[];
    const application = apps[0];
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    await query(
      `UPDATE census_field_applications SET status = ?, admin_notes = ?, reviewed_at = NOW() WHERE id = ?`,
      [status, adminNotes || null, applicationId]
    );

    if (status === 'approved') {
      await handleApprovedCensus(application);
    } else {
      await sendCensusStatusEmail(application, String(status), adminNotes as string | null);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('census-field-applications PUT', e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

async function handleApprovedCensus(application: Record<string, unknown>) {
  const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
  const email = String(application.email ?? '');
  const fullName = String(application.full_name ?? '');

  const existing = (await query('SELECT id FROM users WHERE email = ?', [email])) as { id: number }[];

  let createdNew = false;
  if (existing.length === 0) {
    const user = await createUser(email, tempPassword, fullName, 'census');
    createdNew = user !== null;
    if (!createdNew) {
      console.error('[census-field-applications] createUser failed for approved application:', email);
    }
  }

  await sendCensusWelcomeEmail(application, tempPassword, createdNew);
}

async function sendCensusWelcomeEmail(
  application: Record<string, unknown>,
  tempPassword: string,
  createdNewAccount: boolean
) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const loginUrl = `${base}/login`;
  const fieldUrl = `${base}/dashboard/field`;
  const statusUrl = `${base}/apply-census/status`;
  const name = escapeHtml(String(application.full_name ?? 'Applicant'));
  const emailAddr = String(application.email);

  let html: string;
  if (createdNewAccount) {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1f2937;">
        <h1 style="color: #059669;">Field / census application approved</h1>
        <p>Dear ${name},</p>
        <p>Your application to collect <strong>field / census data</strong> for MedConsult Liberia has been <strong>approved</strong>.</p>
        <p>We created a <strong>census field</strong> account for you. Sign in with the email below and this one-time password, then change your password in your profile.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
          <p style="margin: 0;"><strong>Email:</strong> ${escapeHtml(emailAddr)}</p>
          <p style="margin: 8px 0 0 0;"><strong>Temporary password:</strong> <code>${escapeHtml(tempPassword)}</code></p>
        </div>
        <p><a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 8px;">Log in</a></p>
        <p>After login, open your <a href="${fieldUrl}">field dashboard</a> to see surveys and submit data.</p>
        <p style="color: #6b7280; font-size: 14px;">Check status: <a href="${statusUrl}">${statusUrl}</a></p>
      </div>`;
  } else {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1f2937;">
        <h1 style="color: #059669;">Field / census application approved</h1>
        <p>Dear ${name},</p>
        <p>Your field / census data collection application has been <strong>approved</strong>.</p>
        <p>You already have an account with this email. Please <a href="${loginUrl}">log in</a> with your existing password. Use the <a href="${fieldUrl}">field dashboard</a> for assigned surveys.</p>
        <p style="color: #6b7280; font-size: 14px;">Status: <a href="${statusUrl}">${statusUrl}</a></p>
      </div>`;
  }

  await sendApplicantEmail(emailAddr, 'MedConsult Liberia — Field / census application approved', html);
}

async function sendCensusStatusEmail(
  application: Record<string, unknown>,
  status: string,
  adminNotes: string | null
) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const statusUrl = `${base}/apply-census/status`;
  const name = escapeHtml(String(application.full_name ?? 'Applicant'));
  const emailAddr = String(application.email);
  const notes = adminNotes ? `<p><strong>Message:</strong><br/>${escapeHtml(adminNotes).replace(/\n/g, '<br/>')}</p>` : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1f2937;">
      <p>Dear ${name},</p>
      <p>Your <strong>field / census</strong> application status is: <strong>${escapeHtml(status)}</strong></p>
      ${notes}
      <p style="color: #6b7280; font-size: 14px;">Check anytime: <a href="${statusUrl}">${statusUrl}</a></p>
    </div>`;

  await sendApplicantEmail(emailAddr, `MedConsult Liberia — Field application update (${status})`, html);
}
