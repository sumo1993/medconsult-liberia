import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface AuthUser {
  userId: number;
  email: string;
  role: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get token from query param, cookie, or header
    const { searchParams } = new URL(request.url);
    let token = searchParams.get('token');
    
    if (!token) {
      token = request.cookies.get('auth-token')?.value || null;
    }
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    let user: AuthUser;
    try {
      user = verify(token, JWT_SECRET) as AuthUser;
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const params = await context.params;
    const requestId = params.id;

    // Fetch the final work data
    const [requests] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ar.id,
        ar.final_submission_data,
        ar.final_submission_filename,
        ar.client_id,
        ar.consultant_id,
        ar.doctor_id
       FROM assignment_requests ar
       WHERE ar.id = ?`,
      [requestId]
    );

    if (requests.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = requests[0];

    // Check authorization - allow client, assigned consultant, management, admin
    const isClient = assignment.client_id === user.userId;
    const isAssignedConsultant = assignment.consultant_id === user.userId || assignment.doctor_id === user.userId;
    const isManagementOrAdmin = ['management', 'admin'].includes(user.role);
    const isConsultantViewingReference = user.role === 'consultant'; // Consultants can view completed work for reference

    if (!isClient && !isAssignedConsultant && !isManagementOrAdmin && !isConsultantViewingReference) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!assignment.final_submission_data) {
      return NextResponse.json({ error: 'No final work file found' }, { status: 404 });
    }

    // Determine content type from filename
    const filename = assignment.final_submission_filename || 'final_work';
    let contentType = 'application/octet-stream';
    
    if (filename.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (filename.endsWith('.doc')) {
      contentType = 'application/msword';
    } else if (filename.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (filename.endsWith('.zip')) {
      contentType = 'application/zip';
    } else if (filename.endsWith('.rar')) {
      contentType = 'application/x-rar-compressed';
    } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (filename.endsWith('.png')) {
      contentType = 'image/png';
    }

    return new NextResponse(assignment.final_submission_data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching final work:', error);
    return NextResponse.json(
      { error: 'Failed to fetch final work' },
      { status: 500 }
    );
  }
}

