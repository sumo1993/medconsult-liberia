import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch partnerships (approved for public, all for admin)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request).catch(() => null);
    
    console.log('[Partnerships API] User:', user ? `${user.email} (${user.role})` : 'Not authenticated');
    
    let query = `SELECT id, name, type, logo, description, website, contact_email, contact_phone, status, display_order, created_at
                 FROM partnerships`;
    
    // If not admin, only show published partnerships
    if (!user || user.role !== 'admin') {
      console.log('[Partnerships API] Showing only published partnerships');
      query += ` WHERE status = 'published'`;
    } else {
      console.log('[Partnerships API] Admin access - showing all partnerships');
    }
    
    query += ` ORDER BY display_order ASC, created_at DESC`;

    const [partners] = await pool.execute<RowDataPacket[]>(query);
    
    console.log('[Partnerships API] Returning', partners.length, 'partnerships');

    return NextResponse.json(partners);
  } catch (error) {
    console.error('Error fetching partnerships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partnerships' },
      { status: 500 }
    );
  }
}

// POST - Submit partnership request (anyone can submit, goes to pending)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, logo, description, website, contact_email, contact_phone, display_order } = body;

    const [result] = await pool.execute(
      `INSERT INTO partnerships (name, type, logo, description, website, contact_email, contact_phone, display_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [name, type, logo || null, description || null, website || null, contact_email || null, contact_phone || null, display_order || 0]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId,
      message: 'Partnership request submitted successfully. Awaiting admin approval.'
    });
  } catch (error) {
    console.error('Error creating partnership:', error);
    return NextResponse.json(
      { error: 'Failed to create partnership' },
      { status: 500 }
    );
  }
}
