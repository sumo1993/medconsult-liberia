import { NextRequest, NextResponse } from 'next/server';
import { createUser, logActivity } from '@/lib/auth';
import nodemailer from 'nodemailer';

// Send welcome email
async function sendWelcomeEmail(email: string, fullName: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"MedConsult Liberia" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🎉 Welcome to MedConsult Liberia!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🏥 MedConsult Liberia</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #059669;">Congratulations, ${fullName}! 🎉</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Welcome to <strong>MedConsult Liberia</strong>! Your account has been successfully created.
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              You can now access our healthcare consultation services, request assignments, and connect with our medical professionals.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <h3 style="color: #059669; margin-top: 0;">What you can do:</h3>
              <ul style="color: #374151; line-height: 1.8;">
                <li>📋 Request medical consultations</li>
                <li>📁 Submit assignments for review</li>
                <li>💬 Chat with healthcare professionals</li>
                <li>📚 Access medical resources and research</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://medconsult-liberianew.vercel.app'}/login" 
                 style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Login to Your Account
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions, feel free to contact us at <a href="mailto:medconsultliberia@gmail.com" style="color: #059669;">medconsultliberia@gmail.com</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} MedConsult Liberia. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('[Register] Welcome email sent to:', email);
  } catch (error) {
    console.error('[Register] Failed to send welcome email:', error);
    // Don't throw - email failure shouldn't prevent registration
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, phone, role } = body;

    // Validate input
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Only allow client registration through public endpoint
    // Admin and management accounts must be created by admins
    const userRole = role === 'client' || !role ? 'client' : 'client';

    const user = await createUser(email, password, full_name, userRole, phone);

    if (!user) {
      return NextResponse.json(
        { error: 'User already exists or registration failed' },
        { status: 400 }
      );
    }

    // Log activity
    await logActivity(
      user.id,
      'register',
      'user',
      user.id,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(email, full_name);

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! Please check your email and login.',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
