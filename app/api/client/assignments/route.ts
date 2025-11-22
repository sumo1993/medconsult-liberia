import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get assignments for this client
    const [assignments] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM assignment_requests 
       WHERE client_id = ? 
       ORDER BY created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, subject, deadline, priority, fileCount, fileNames } = body;

    if (!title || !description || !subject) {
      return NextResponse.json(
        { error: 'Title, description, and subject are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO assignment_requests 
       (client_id, title, description, subject, deadline, priority, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [user.userId, title, description, subject, deadline || null, priority || 'medium']
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Assignment request submitted successfully',
        id: (result as any).insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating assignment request:', error);
    return NextResponse.json(
      { error: 'Failed to submit assignment request' },
      { status: 500 }
    );
  }
}
