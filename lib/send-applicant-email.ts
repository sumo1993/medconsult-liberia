import { sendHtmlEmail } from '@/lib/email';

/**
 * Sends email to an applicant using the same SMTP_* / Gmail App Password config as the rest of the app.
 * Returns true if sent, false if SMTP failed or is not configured.
 */
export async function sendApplicantEmail(
  to: string,
  subject: string,
  html: string,
  textBody?: string
): Promise<boolean> {
  try {
    await sendHtmlEmail(to, subject, html, textBody);
    return true;
  } catch (e) {
    console.error('[sendApplicantEmail]', e);
    return false;
  }
}
