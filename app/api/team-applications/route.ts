import { NextRequest, NextResponse } from 'next/server';
import pool, { IS_POSTGRES, query } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { sendApplicantEmail } from '@/lib/send-applicant-email';
import { createUser } from '@/lib/auth';
import {
  sendTeamApplicationAdminNotification,
  sendTeamApplicationReceivedEmail,
} from '@/lib/email';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let ensureTablePromise: Promise<void> | null = null;

async function ensureTeamApplicationsTable(): Promise<void> {
  if (ensureTablePromise) {
    await ensureTablePromise;
    return;
  }
  ensureTablePromise = (async () => {
    if (IS_POSTGRES) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS team_applications (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          specialty VARCHAR(100) NOT NULL,
          experience INT NOT NULL,
          education TEXT NOT NULL,
          license_number VARCHAR(100) NOT NULL,
          availability VARCHAR(50) NOT NULL,
          motivation TEXT NOT NULL,
          resume_filename VARCHAR(255),
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          admin_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP NULL,
          reviewed_by INT NULL
        )
      `);
    } else {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS team_applications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          specialty VARCHAR(100) NOT NULL,
          experience INT NOT NULL,
          education TEXT NOT NULL,
          license_number VARCHAR(100) NOT NULL,
          availability VARCHAR(50) NOT NULL,
          motivation TEXT NOT NULL,
          resume_filename VARCHAR(255),
          status ENUM('pending', 'reviewing', 'approved', 'rejected') DEFAULT 'pending',
          admin_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP NULL,
          reviewed_by INT NULL
        )
      `);
    }
  })();
  await ensureTablePromise;
}

async function notifyAdminsAndApplicant(applicationData: {
  fullName: string;
  email: string;
  phone: string;
  specialty: string;
  experience: number;
  licenseNumber: string;
}) {
  try {
    const adminUsers = (await query(
      "SELECT email FROM users WHERE role IN ('admin', 'management') AND status = 'active'"
    )) as { email: string }[];
    const recipients = adminUsers?.map((u) => u.email).filter(Boolean).join(', ') || '';
    if (recipients) {
      await sendTeamApplicationAdminNotification(recipients, applicationData);
    }
  } catch (error) {
    console.error('[team-applications] Admin notification email:', error);
  }
  try {
    await sendTeamApplicationReceivedEmail(
      applicationData.email,
      applicationData.fullName,
      applicationData.specialty
    );
  } catch (error) {
    console.error('[team-applications] Applicant confirmation email:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTeamApplicationsTable();

    const data = await request.json();
    const experienceYears = Math.max(0, parseInt(String(data.experience), 10) || 0);

    const params = [
      data.fullName,
      data.email,
      data.phone,
      data.specialty,
      experienceYears,
      data.education,
      data.licenseNumber,
      data.availability,
      data.motivation,
      data.resumeFilename || null,
    ];

    let applicationId = 0;

    if (IS_POSTGRES) {
      const [rows] = await pool.execute<{ id: number }[]>(
        `INSERT INTO team_applications
          (full_name, email, phone, specialty, experience, education, license_number, availability, motivation, resume_filename)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id`,
        params
      );
      applicationId = Number(rows[0]?.id ?? 0);
    } else {
      const [insertResult] = await pool.execute(
        `INSERT INTO team_applications
          (full_name, email, phone, specialty, experience, education, license_number, availability, motivation, resume_filename)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
      applicationId = Number((insertResult as { insertId?: number }).insertId ?? 0);
    }

    void notifyAdminsAndApplicant({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      specialty: data.specialty,
      experience: experienceYears,
      licenseNumber: data.licenseNumber,
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId,
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureTeamApplicationsTable();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let selectQuery = `
      SELECT 
        id,
        full_name,
        email,
        phone,
        specialty,
        experience,
        education,
        license_number,
        availability,
        motivation,
        resume_filename,
        status,
        admin_notes,
        created_at,
        reviewed_at
      FROM team_applications
    `;

    const sqlParams: unknown[] = [];

    if (status) {
      selectQuery += ' WHERE status = ?';
      sqlParams.push(status);
    }

    selectQuery += ' ORDER BY created_at DESC';

    const applications = await query(selectQuery, sqlParams);
    const result = Array.isArray(applications) ? applications : [];

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'management'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureTeamApplicationsTable();

    const data = await request.json();
    const { applicationId, status, adminNotes } = data;

    const appQuery = 'SELECT * FROM team_applications WHERE id = ?';
    const applications = (await query(appQuery, [applicationId])) as Record<string, unknown>[];
    const application = applications[0];

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const updateQuery = `
      UPDATE team_applications 
      SET status = ?, admin_notes = ?, reviewed_at = NOW()
      WHERE id = ?
    `;

    await query(updateQuery, [status, adminNotes || null, applicationId]);

    if (status === 'approved') {
      await handleApprovedApplication(application);
    } else {
      await sendStatusUpdateEmail(application, status, adminNotes);
    }

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully',
    });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      {
        error: 'Failed to update application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleApprovedApplication(application: Record<string, unknown>) {
  try {
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    const email = String(application.email ?? '');
    const fullName = String(application.full_name ?? '');

    const existingUser = (await query('SELECT id FROM users WHERE email = ?', [email])) as { id: number }[];

    let createdNewAccount = false;
    if (existingUser.length === 0) {
      const user = await createUser(email, tempPassword, fullName, 'researcher');
      createdNewAccount = user !== null;
      if (!createdNewAccount) {
        console.error('[team-applications] createUser failed for approved application:', email);
      }
    }

    await sendWelcomeEmail(application, tempPassword, createdNewAccount);
  } catch (error) {
    console.error('Error creating user account:', error);
    throw error;
  }
}

async function sendWelcomeEmail(
  application: Record<string, unknown>,
  tempPassword: string,
  createdNewAccount: boolean
) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const loginUrl = `${base}/login`;
  const statusUrl = `${base}/apply-team/status`;
  const researcherUrl = `${base}/dashboard/researcher`;

  const name = escapeHtml(String(application.full_name ?? 'Applicant'));
  const emailAddr = String(application.email);

  let html: string;
  if (createdNewAccount) {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <h1 style="color: #059669;">Your application was approved</h1>
        <p>Dear ${name},</p>
        <p>Congratulations — your <strong>Join Our Team</strong> application for MedConsult Liberia has been <strong>approved</strong>.</p>
        <p>We created a <strong>researcher</strong> account for you. Sign in with the email you applied with and this one-time password, then change your password in your profile.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Email (login):</strong> ${escapeHtml(emailAddr)}</p>
          <p style="margin: 8px 0 0 0;"><strong>Temporary password:</strong> <code style="font-size: 15px;">${escapeHtml(tempPassword)}</code></p>
        </div>
        <p><a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Log in</a></p>
        <p>After login you can open your <a href="${researcherUrl}">researcher dashboard</a>.</p>
        <p style="color: #6b7280; font-size: 14px;">You can also check your status anytime: <a href="${statusUrl}">${statusUrl}</a></p>
      </div>`;
  } else {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <h1 style="color: #059669;">Your application was approved</h1>
        <p>Dear ${name},</p>
        <p>Your <strong>Join Our Team</strong> application has been <strong>approved</strong>.</p>
        <p>You already have an account with this email. Please <a href="${loginUrl}">log in</a> with your existing password. If you forgot it, use &quot;Forgot password&quot; on the login page.</p>
        <p>Your role may have been updated — after logging in, use the dashboard link you normally use, or visit <a href="${researcherUrl}">researcher dashboard</a> if you were granted researcher access.</p>
        <p style="color: #6b7280; font-size: 14px;">Check status: <a href="${statusUrl}">${statusUrl}</a></p>
      </div>`;
  }

  await sendApplicantEmail(emailAddr, '🎉 MedConsult Liberia — Your team application was approved', html);
}

async function sendStatusUpdateEmail(
  application: Record<string, unknown>,
  status: string,
  adminNotes: string | null
) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const statusUrl = `${base}/apply-team/status`;
  const name = escapeHtml(String(application.full_name ?? 'Applicant'));
  const emailAddr = String(application.email);

  const statusLabel =
    status === 'reviewing'
      ? 'under review'
      : status === 'rejected'
        ? 'not moving forward at this time'
        : status;

  const notesBlock = adminNotes
    ? `<p><strong>Message from our team:</strong><br/>${escapeHtml(adminNotes).replace(/\n/g, '<br/>')}</p>`
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <p>Dear ${name},</p>
      <p>Your <strong>Join Our Team</strong> application has been updated.</p>
      <p><strong>Current status:</strong> ${escapeHtml(status)} (${escapeHtml(statusLabel)})</p>
      ${notesBlock}
      <p style="color: #6b7280; font-size: 14px;">Check anytime: <a href="${statusUrl}">${statusUrl}</a></p>
    </div>`;

  await sendApplicantEmail(emailAddr, `MedConsult Liberia — Application update (${status})`, html);
}
