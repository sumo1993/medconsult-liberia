import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(
  email: string,
  fullName: string,
  resetToken: string
) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  try {
    await transporter.sendMail({
      from: '"MedConsult Liberia" <noreply@medconsult.com>',
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
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px;">
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
    });

    console.log(`[Email] Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
    throw error;
  }
}
