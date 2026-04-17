import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET - Fetch users that can be messaged based on role
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = '';
    let params: any[] = [];

    if (user.role === 'admin') {
      // Admin can message anyone except themselves
      query = `
        SELECT id, full_name, email, role 
        FROM users 
        WHERE id != ? AND status = 'active'
        ORDER BY role, full_name ASC
      `;
      params = [user.userId];
    } else if (user.role === 'management') {
      // Management can message core internal team
      query = `
        SELECT id, full_name, email, role 
        FROM users
        WHERE id != ? AND status = 'active' AND role IN ('admin', 'consultant', 'management', 'researcher', 'accountant')
        ORDER BY role, full_name ASC
      `;
      params = [user.userId];
    } else if (user.role === 'consultant') {
      // Consultants can only message management and admin
      query = `
        SELECT id, full_name, email, role 
        FROM users 
        WHERE status = 'active' AND role IN ('admin', 'management')
        ORDER BY role, full_name ASC
      `;
      params = [];
    } else if (user.role === 'researcher') {
      // Researchers can message admin/accountant/researchers
      query = `
        SELECT id, full_name, email, role
        FROM users
        WHERE id != ? AND status = 'active' AND role IN ('admin', 'accountant', 'researcher')
        ORDER BY role, full_name ASC
      `;
      params = [user.userId];
    } else if (user.role === 'accountant') {
      // Accountants can message admin/researcher/accountants
      query = `
        SELECT id, full_name, email, role
        FROM users
        WHERE id != ? AND status = 'active' AND role IN ('admin', 'researcher', 'accountant')
        ORDER BY role, full_name ASC
      `;
      params = [user.userId];
    } else {
      // Other roles (client, etc.) - limited messaging
      query = `
        SELECT id, full_name, email, role 
        FROM users 
        WHERE status = 'active' AND role IN ('admin', 'management')
        ORDER BY role, full_name ASC
      `;
      params = [];
    }

    const [users] = await pool.execute<RowDataPacket[]>(query, params);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
