import nodemailer from 'nodemailer';

/** Gmail App Passwords are 16 chars; strip spaces and stray quotes from .env. */
function smtpPass(): string {
  let p = (process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');
  if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
    p = p.slice(1, -1).replace(/\s+/g, '');
  }
  return p;
}

const smtpUser = (process.env.SMTP_USER || '').trim();

/** Treat as Gmail if host says gmail OR the sender is a @gmail.com address (avoids wrong Brevo default). */
const isGmail =
  Boolean(process.env.SMTP_HOST?.toLowerCase().includes('gmail')) ||
  /@gmail\.com$/i.test(smtpUser);

const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpSecure =
  smtpPort === 465 || (process.env.SMTP_SECURE || '').toLowerCase() === 'true';

const useGmailServicePreset =
  isGmail && (process.env.SMTP_USE_GMAIL_SERVICE || 'true').toLowerCase() !== 'false';

function gmailAuth() {
  return { user: smtpUser, pass: smtpPass() };
}

/** Nodemailer’s built‑in Gmail preset — often works when manual host/port fails. */
function createGmailServiceTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: gmailAuth(),
    connectionTimeout: 25000,
    greetingTimeout: 25000,
    socketTimeout: 35000,
  });
}

function createPrimaryTransporter() {
  const auth = gmailAuth();

  return nodemailer.createTransport(
    isGmail
      ? {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: smtpPort,
          secure: smtpSecure,
          ...(smtpPort === 587 && !smtpSecure ? { requireTLS: true } : {}),
          auth,
          connectionTimeout: 25000,
          greetingTimeout: 25000,
          socketTimeout: 35000,
        }
      : {
          host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
          port: smtpPort,
          secure: smtpSecure,
          auth,
          connectionTimeout: 25000,
          greetingTimeout: 25000,
          socketTimeout: 35000,
        }
  );
}

function createGmailTlsFallbackTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: gmailAuth(),
    connectionTimeout: 25000,
    greetingTimeout: 25000,
    socketTimeout: 35000,
  });
}

function createGmail587FallbackTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: gmailAuth(),
    connectionTimeout: 25000,
    greetingTimeout: 25000,
    socketTimeout: 35000,
  });
}

// Use the actual SMTP email as the from address for Gmail
const fromEmail = process.env.SMTP_USER || 'noreply@medconsult.com';

async function sendWithConfiguredTransport(mailOptions: nodemailer.SendMailOptions) {
  const pass = smtpPass();
  if (!smtpUser || !pass) {
    throw new Error(
      'SMTP is not configured: set SMTP_USER and SMTP_PASS (use a Gmail App Password, not your normal password).'
    );
  }

  if (isGmail && pass.length !== 16) {
    console.warn(
      '[Email] Gmail App Password is usually exactly 16 characters (after removing spaces). Check SMTP_PASS in .env.local.'
    );
  }

  if (!isGmail) {
    await createPrimaryTransporter().sendMail(mailOptions);
    return;
  }

  /** Try several Gmail transports — 534 / WebLoginRequired often clears after switching method or fixing App Password. */
  const attempts: { name: string; create: () => nodemailer.Transporter }[] = [];
  if (useGmailServicePreset) {
    attempts.push({ name: 'gmail-service', create: createGmailServiceTransporter });
  }
  attempts.push({ name: `smtp-${smtpPort}`, create: createPrimaryTransporter });
  attempts.push({ name: 'smtp-587-starttls', create: createGmail587FallbackTransporter });
  attempts.push({ name: 'smtp-465-ssl', create: createGmailTlsFallbackTransporter });

  let lastError: unknown;
  for (const { name, create } of attempts) {
    try {
      const t = create();
      await t.sendMail(mailOptions);
      if (name !== (useGmailServicePreset ? 'gmail-service' : `smtp-${smtpPort}`)) {
        console.warn(`[Email] Gmail send succeeded via fallback: ${name}`);
      }
      return;
    } catch (err) {
      lastError = err;
      const msg = String((err as Error)?.message || '');
      console.warn(`[Email] Gmail attempt "${name}" failed:`, msg.slice(0, 200));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Gmail SMTP failed after all retries. Check App Password and Google account security.');
}

export async function sendPasswordResetEmail(
  email: string,
  fullName: string,
  resetToken: string,
  resetLinkOverride?: string
) {
  const resetLink =
    resetLinkOverride ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  try {
    const mailOptions = {
      from: `"MedConsult Liberia" <${fromEmail}>`,
      to: email,
      subject: 'Reset Your Password - MedConsult Liberia',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <!-- Header -->
              <div style="background: #059669; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">MedConsult Liberia</h1>
              </div>
              
              <!-- Content -->
              <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
                <h2 style="color: #059669; margin-top: 0;">Reset Your Password</h2>
                <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${fullName}</strong>,</p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  We received a request to reset your password for your MedConsult Liberia account. 
                  Click the button below to create a new password:
                </p>
                
                <!-- Button -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${resetLink}" 
                     style="display: inline-block; padding: 14px 40px; background: #059669; 
                            color: white; text-decoration: none; border-radius: 6px; font-weight: bold;
                            font-size: 16px;">
                    Reset Password
                  </a>
                </div>
                
                <!-- Alternative Link -->
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="font-size: 13px; word-break: break-all; color: #059669; background: #f3f4f6; 
                          padding: 12px; border-radius: 4px; margin-bottom: 25px;">
                  ${resetLink}
                </p>
                
                <!-- Expiry Warning -->
                <div style="background: #fef3c7; padding: 15px; margin-bottom: 25px; border-radius: 6px;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
                  </p>
                </div>
                
                <!-- Security Note -->
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                  If you didn't request this password reset, you can safely ignore this email. 
                  Your password will remain unchanged.
                </p>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Best regards,<br>
                  <strong>The MedConsult Liberia Team</strong>
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #f9fafb; padding: 20px; text-align: center; 
                          border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="margin: 0; font-size: 12px; color: #6b7280;">
                  &copy; ${new Date().getFullYear()} MedConsult Liberia. All rights reserved.
                </p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                  This is an automated email. Please do not reply to this message.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Hello ${fullName},

We received a request to reset your password for your MedConsult Liberia account.

To reset your password, click the link below or copy and paste it into your browser:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The MedConsult Liberia Team

---
© ${new Date().getFullYear()} MedConsult Liberia. All rights reserved.
This is an automated email. Please do not reply to this message.
      `,
    };
    await sendWithConfiguredTransport(mailOptions);

    console.log(`[Email] Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
    throw error;
  }
}

function parseReportRecipients(overrideRecipients?: string[]): string[] {
  if (Array.isArray(overrideRecipients) && overrideRecipients.length) {
    return overrideRecipients.map((email) => email.trim()).filter(Boolean);
  }

  const raw =
    process.env.REPORT_NOTIFICATION_EMAILS ||
    [process.env.CEO_EMAIL, process.env.ADMIN_EMAIL].filter(Boolean).join(',');

  return raw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function sendResearchReportNotificationEmail({
  title,
  reportType,
  projectName,
  submittedByName,
  submittedByEmail,
  createdAt,
  recipients,
}: {
  title: string;
  reportType: string;
  projectName?: string | null;
  submittedByName: string;
  submittedByEmail: string;
  createdAt: string;
  recipients?: string[];
}) {
  const parsedRecipients = parseReportRecipients(recipients);
  if (!parsedRecipients.length) {
    console.log('[Email] Skipping research report email: no leadership recipients configured.');
    return false;
  }

  const subject = `New Research Report Submitted: ${title}`;
  const createdDate = new Date(createdAt).toLocaleString();
  const safeProjectName = projectName || 'N/A';

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"MedConsult Liberia" <${fromEmail}>`,
    to: parsedRecipients.join(', '),
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="color: #065f46;">New Research Report Submitted</h2>
        <p>A researcher has submitted a new report for leadership review.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 640px;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Title</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Type</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb; text-transform: capitalize;">${reportType}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Project</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${safeProjectName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Submitted By</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${submittedByName} (${submittedByEmail})</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Submitted At</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${createdDate}</td></tr>
        </table>
        <p style="margin-top: 16px;">Please review this report in the dashboard.</p>
      </div>
    `,
    text: [
      'New Research Report Submitted',
      `Title: ${title}`,
      `Type: ${reportType}`,
      `Project: ${safeProjectName}`,
      `Submitted By: ${submittedByName} (${submittedByEmail})`,
      `Submitted At: ${createdDate}`,
      'Please review this report in the dashboard.',
    ].join('\n'),
  };

  await sendWithConfiguredTransport(mailOptions);
  console.log(`[Email] Research report notification sent to: ${parsedRecipients.join(', ')}`);
  return true;
}

// --- Shared transactional templates (registration & applications) ---

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

function emailBrandWrapper(innerHtml: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;background:#f3f4f6;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#047857 0%,#059669 100%);padding:28px 24px;text-align:center;">
          <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700;">MedConsult Liberia</h1>
          <p style="margin:8px 0 0;font-size:13px;color:#d1fae5;">Healthcare · Research · Public health</p>
        </td></tr>
        <tr><td style="padding:32px 28px;font-size:15px;line-height:1.65;color:#374151;">
          ${innerHtml}
        </td></tr>
        <tr><td style="padding:20px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;">
          © ${year} MedConsult Liberia<br/>
          <span style="color:#9ca3af;">Automated message — for support, reply is not monitored; use the contact options on our website.</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="display:inline-block;padding:14px 32px;background:#059669;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">${escapeHtml(label)}</a>
  </div>`;
}

/**
 * Low-level HTML email using the same SMTP transport as password reset (SMTP_* / Gmail App Password).
 */
export async function sendHtmlEmail(
  to: string,
  subject: string,
  html: string,
  textFallback?: string
): Promise<void> {
  await sendWithConfiguredTransport({
    from: `"MedConsult Liberia" <${fromEmail}>`,
    to,
    subject,
    html,
    text: textFallback || 'Please view this email in an HTML-capable client.',
  });
}

/** After successful client sign-up on /register */
export async function sendRegistrationWelcomeEmail(recipientEmail: string, fullName: string): Promise<void> {
  const origin = getAppOrigin();
  const loginUrl = `${origin}/login`;
  const name = escapeHtml(fullName);
  const inner = `
    <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#047857;">Welcome, ${name}!</p>
    <p style="margin:0 0 16px;">Your MedConsult Liberia account is ready. You can sign in to book consultations, request assignment help, message your care team, and access health resources.</p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#4b5563;">
      <li style="margin-bottom:8px;">Book appointments and manage your profile</li>
      <li style="margin-bottom:8px;">Request help with assignments and research</li>
      <li style="margin-bottom:8px;">Receive secure messages from our team</li>
    </ul>
    ${ctaButton(loginUrl, 'Sign in to your account')}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">If you did not create this account, please ignore this email or contact us through our website.</p>
  `;
  await sendHtmlEmail(
    recipientEmail,
    'Welcome to MedConsult Liberia — your account is ready',
    emailBrandWrapper(inner),
    `Welcome, ${fullName}!\n\nYour account is ready. Sign in: ${loginUrl}\n\n— MedConsult Liberia`
  );
}

/** Applicant confirmation: Join Our Team form */
export async function sendTeamApplicationReceivedEmail(
  recipientEmail: string,
  fullName: string,
  specialty: string
): Promise<void> {
  const origin = getAppOrigin();
  const statusUrl = `${origin}/apply-team/status`;
  const inner = `
    <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#047857;">We received your application</p>
    <p style="margin:0 0 12px;">Hi ${escapeHtml(fullName)},</p>
    <p style="margin:0 0 16px;">Thank you for applying to join <strong>MedConsult Liberia</strong>. Your submission for <strong>${escapeHtml(specialty)}</strong> is now in our review queue.</p>
    <p style="margin:0 0 16px;color:#4b5563;">Our leadership team will review your credentials and experience. You will receive another email when your application is approved, declined, or if we need more information.</p>
    ${ctaButton(statusUrl, 'Check application status')}
    <p style="margin:20px 0 0;font-size:14px;color:#6b7280;">Reference: use the same email address you applied with when checking status.</p>
  `;
  await sendHtmlEmail(
    recipientEmail,
    'MedConsult Liberia — We received your team application',
    emailBrandWrapper(inner),
    `Hi ${fullName}, we received your team application (${specialty}). Check status: ${statusUrl}`
  );
}

/** Applicant confirmation: field / census application */
export async function sendCensusFieldApplicationReceivedEmail(
  recipientEmail: string,
  fullName: string,
  preferredRegion: string
): Promise<void> {
  const origin = getAppOrigin();
  const statusUrl = `${origin}/apply-census/status`;
  const inner = `
    <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#047857;">We received your application</p>
    <p style="margin:0 0 12px;">Hi ${escapeHtml(fullName)},</p>
    <p style="margin:0 0 16px;">Thank you for applying to support <strong>field / census data collection</strong> with MedConsult Liberia. Your interest in <strong>${escapeHtml(preferredRegion)}</strong> has been recorded.</p>
    <p style="margin:0 0 16px;color:#4b5563;">We will review your experience and motivation and email you again when a decision is made or if we need more details.</p>
    ${ctaButton(statusUrl, 'Check application status')}
    <p style="margin:20px 0 0;font-size:14px;color:#6b7280;">Keep this email for your records.</p>
  `;
  await sendHtmlEmail(
    recipientEmail,
    'MedConsult Liberia — Field / census application received',
    emailBrandWrapper(inner),
    `Hi ${fullName}, we received your field/census application (${preferredRegion}). Status: ${statusUrl}`
  );
}

/** Internal: new team application (admins / management) */
export async function sendTeamApplicationAdminNotification(
  adminEmailsCsv: string,
  data: {
    fullName: string;
    email: string;
    phone: string;
    specialty: string;
    experience: number;
    licenseNumber: string;
  }
): Promise<void> {
  if (!adminEmailsCsv.trim()) return;
  const origin = getAppOrigin();
  const inner = `
    <p style="margin:0 0 16px;font-size:17px;font-weight:600;color:#047857;">New team application</p>
    <p style="margin:0 0 16px;color:#4b5563;">A new application was submitted from the public <strong>Join Our Team</strong> form.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;width:140px;">Name</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.fullName)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Email</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.email)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Phone</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.phone)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Specialty</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.specialty)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Experience</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${data.experience} years</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">License</td><td style="padding:8px 0;">${escapeHtml(data.licenseNumber)}</td></tr>
    </table>
    ${ctaButton(`${origin}/dashboard/management/team-applications`, 'Review in CEO dashboard')}
    <p style="text-align:center;margin:12px 0 0;"><a href="${origin}/dashboard/admin/team-applications" style="color:#047857;font-size:14px;">Open admin team applications</a></p>
  `;
  await sendHtmlEmail(
    adminEmailsCsv,
    'New team application — MedConsult Liberia',
    emailBrandWrapper(inner),
    `New team application from ${data.fullName} (${data.email}). Review: ${origin}/dashboard/management/team-applications`
  );
}

/** Internal: new census / field application */
export async function sendCensusFieldAdminNotification(
  adminEmailsCsv: string,
  data: { fullName: string; email: string; phone: string; preferredRegion: string }
): Promise<void> {
  if (!adminEmailsCsv.trim()) return;
  const origin = getAppOrigin();
  const inner = `
    <p style="margin:0 0 16px;font-size:17px;font-weight:600;color:#047857;">New field / census application</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;width:140px;">Name</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.fullName)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Email</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.email)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Phone</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.phone)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Preferred area</td><td style="padding:8px 0;">${escapeHtml(data.preferredRegion)}</td></tr>
    </table>
    <p style="margin:20px 0 12px;">
      <a href="${origin}/dashboard/management/census-field-applications" style="color:#059669;font-weight:600;">CEO review →</a>
      &nbsp;·&nbsp;
      <a href="${origin}/dashboard/admin/census-field-applications" style="color:#059669;">Admin review →</a>
    </p>
  `;
  await sendHtmlEmail(
    adminEmailsCsv,
    'New field / census application — MedConsult Liberia',
    emailBrandWrapper(inner),
    `New census/field application: ${data.fullName} <${data.email}>, region: ${data.preferredRegion}`
  );
}
