import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send notification email to admin/CEO
async function sendNotificationEmail(applicationData: any) {
  try {
    // Get admin and CEO emails
    const adminUsers: any = await query(
      "SELECT email FROM users WHERE role IN ('admin', 'management') AND status = 'active'"
    );

    if (!adminUsers || adminUsers.length === 0) return;

    const recipients = adminUsers.map((user: any) => user.email).join(', ');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients,
      subject: '🎯 New Team Application - MedConsult Liberia',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Team Application</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <p style="font-size: 16px; color: #374151;">A new application has been submitted to join the MedConsult Liberia team.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #059669; margin-top: 0;">Applicant Information</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Name:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${applicationData.fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${applicationData.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Phone:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${applicationData.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Specialty:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${applicationData.specialty}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Experience:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${applicationData.experience} years</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">License:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${applicationData.licenseNumber}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/admin/team-applications" 
                 style="display: inline-block; padding: 15px 30px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Review Application
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              This is an automated notification from MedConsult Liberia
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Notification email sent to admin/CEO');
  } catch (error) {
    console.error('Error sending notification email:', error);
    // Don't throw error - application should still be saved even if email fails
  }
}

// Create applications table if it doesn't exist
async function ensureTableExists() {
  const createTableQuery = `
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
  `;
  
  try {
    await query(createTableQuery);
  } catch (error) {
    console.error('Error creating team_applications table:', error);
  }
}

// POST - Submit new application
export async function POST(request: NextRequest) {
  try {
    await ensureTableExists();
    
    const data = await request.json();
    
    const insertQuery = `
      INSERT INTO team_applications 
      (full_name, email, phone, specialty, experience, education, license_number, availability, motivation, resume_filename)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result: any = await query(insertQuery, [
      data.fullName,
      data.email,
      data.phone,
      data.specialty,
      data.experience,
      data.education,
      data.licenseNumber,
      data.availability,
      data.motivation,
      data.resumeFilename || null
    ]);
    
    // Send notification email to admin/CEO
    await sendNotificationEmail(data);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully',
      applicationId: result.insertId 
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

// GET - Fetch all applications (Admin only)
export async function GET(request: NextRequest) {
  try {
    await ensureTableExists();
    
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
    
    const params: any[] = [];
    
    if (status) {
      selectQuery += ' WHERE status = ?';
      params.push(status);
    }
    
    selectQuery += ' ORDER BY created_at DESC';
    
    const applications: any = await query(selectQuery, params);
    
    console.log('Fetched applications:', applications);
    console.log('Applications count:', Array.isArray(applications) ? applications.length : 'Not an array');
    
    // Ensure we return an array
    const result = Array.isArray(applications) ? applications : [];
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// PUT - Update application status (Admin only)
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT request received');
    const data = await request.json();
    const { applicationId, status, adminNotes } = data;
    console.log('Request data:', { applicationId, status, adminNotes });
    
    // Get application details first
    const appQuery = 'SELECT * FROM team_applications WHERE id = ?';
    const applications = await query(appQuery, [applicationId]) as any[];
    const application = applications[0];
    
    console.log('Application found:', application ? 'Yes' : 'No');
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    // Update application status
    console.log('Updating application status in database...');
    const updateQuery = `
      UPDATE team_applications 
      SET status = ?, admin_notes = ?, reviewed_at = NOW()
      WHERE id = ?
    `;
    
    await query(updateQuery, [status, adminNotes || null, applicationId]);
    console.log('Database updated successfully');
    
    // If approved, create user account and send welcome email
    if (status === 'approved') {
      console.log('Processing approved application...');
      await handleApprovedApplication(application);
    } else {
      console.log('Sending status update email...');
      // Send status update email for other statuses
      await sendStatusUpdateEmail(application, status, adminNotes);
    }
    
    console.log('Application update completed successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Application updated successfully' 
    });
  } catch (error) {
    console.error('Error updating application:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Failed to update application',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle approved application - create user account
async function handleApprovedApplication(application: any) {
  try {
    const bcrypt = require('bcryptjs');
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [application.email]) as any[];
    
    if (existingUser.length === 0) {
      // Create user account with 'researcher' role
      const insertUserQuery = `
        INSERT INTO users (full_name, email, password_hash, role, status, created_at)
        VALUES (?, ?, ?, 'researcher', 'active', NOW())
      `;
      
      await query(insertUserQuery, [
        application.full_name,
        application.email,
        hashedPassword
      ]);
      
      console.log('User account created for:', application.email);
    }
    
    // Send welcome email with credentials
    await sendWelcomeEmail(application, tempPassword);
    
  } catch (error) {
    console.error('Error creating user account:', error);
    throw error;
  }
}

// Send welcome email with login credentials
async function sendWelcomeEmail(application: any, tempPassword: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: application.email,
    subject: '🎉 Welcome to MedConsult Liberia - Your Application is Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 Congratulations!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">Dear ${application.full_name},</p>
          
          <p style="font-size: 16px; color: #374151;">
            We are thrilled to inform you that your application to join MedConsult Liberia has been <strong style="color: #10b981;">APPROVED</strong>! 
            Welcome to our team of dedicated healthcare professionals.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #10b981; margin-top: 0;">Your Login Credentials</h3>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${application.email}</p>
            <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-size: 14px;">${tempPassword}</code></p>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Important:</strong> Please change your password immediately after your first login for security purposes.
            </p>
          </div>
          
          <h3 style="color: #374151;">Next Steps:</h3>
          <ol style="color: #374151; line-height: 1.8;">
            <li>Visit our login page: <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" style="color: #10b981;">Login Here</a></li>
            <li>Use your email and temporary password to log in</li>
            <li>Change your password in your profile settings</li>
            <li>Complete your researcher profile</li>
            <li>Start working on assignments and research!</li>
          </ol>
          
          <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #075985;">
              <strong>📚 Need Help?</strong> Check out our consultant guide or contact our support team at support@medconsult-liberia.com
            </p>
          </div>
          
          <p style="font-size: 16px; color: #374151;">
            We're excited to have you on board and look forward to the positive impact you'll make in our community!
          </p>
          
          <p style="font-size: 16px; color: #374151;">
            Best regards,<br>
            <strong>The MedConsult Liberia Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2024 MedConsult Liberia. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log('Welcome email sent to:', application.email);
}

// Send status update email for other statuses
async function sendStatusUpdateEmail(application: any, status: string, adminNotes: string | null) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  let statusColor = '#3b82f6';
  let statusEmoji = '📋';
  let statusMessage = '';

  if (status === 'reviewing') {
    statusColor = '#3b82f6';
    statusEmoji = '🔍';
    statusMessage = 'Your application is currently under review. We will notify you once a decision has been made.';
  } else if (status === 'rejected') {
    statusColor = '#ef4444';
    statusEmoji = '❌';
    statusMessage = 'Unfortunately, we are unable to proceed with your application at this time. We encourage you to apply again in the future.';
  }

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: application.email,
    subject: `${statusEmoji} Application Status Update - MedConsult Liberia`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${statusColor}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">${statusEmoji} Application Status Update</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">Dear ${application.full_name},</p>
          
          <p style="font-size: 16px; color: #374151;">
            Your application to join MedConsult Liberia has been updated to: <strong style="color: ${statusColor}; text-transform: uppercase;">${status}</strong>
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
            <p style="margin: 0; color: #374151;">${statusMessage}</p>
          </div>
          
          ${adminNotes ? `
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #374151;">Additional Notes:</h4>
            <p style="margin: 0; color: #6b7280;">${adminNotes}</p>
          </div>
          ` : ''}
          
          <p style="font-size: 16px; color: #374151;">
            If you have any questions, please don't hesitate to contact us.
          </p>
          
          <p style="font-size: 16px; color: #374151;">
            Best regards,<br>
            <strong>The MedConsult Liberia Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2024 MedConsult Liberia. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log('Status update email sent to:', application.email);
}
