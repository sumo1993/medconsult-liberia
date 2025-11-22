import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch team members (active for public, all for admin)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request).catch(() => null);
    
    let query = `SELECT id, name, role, specialization, bio, photo, email, phone, linkedin, facebook, status, display_order, created_at
                 FROM team_members`;
    
    // If not admin, only show active team members
    if (!user || user.role !== 'admin') {
      query += ` WHERE status = 'active'`;
    }
    
    query += ` ORDER BY display_order ASC, created_at DESC`;

    const [members] = await pool.execute<RowDataPacket[]>(query);

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST - Create team member (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, role, specialization, bio, photo, email, phone, linkedin, facebook, display_order, status } = body;

    const [result] = await pool.execute(
      `INSERT INTO team_members (name, role, specialization, bio, photo, email, phone, linkedin, facebook, display_order, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        role, 
        specialization || null, 
        bio || null, 
        photo || null, 
        email || null, 
        phone || null, 
        linkedin || null, 
        facebook || null, 
        display_order || 0,
        status || 'active',
        user.userId || (user as any).id || null
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId,
      message: 'Team member created successfully'
    });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}
