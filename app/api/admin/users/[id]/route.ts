import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

// PUT - Update user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = parseInt(id);
    console.log('Updating user ID:', userId);
    
    const { full_name, role, password } = await request.json();
    console.log('Update data:', { full_name, role, hasPassword: !!password });

    // Validate required fields
    if (!full_name || !role) {
      return NextResponse.json(
        { error: 'Full name and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'management', 'client', 'accountant', 'consultant', 'researcher'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Build update query
    let updateQuery = 'UPDATE users SET full_name = ?, role = ?';
    const queryParams: any[] = [full_name, role];

    // If password is provided, hash and include it
    if (password && password.length >= 8) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password_hash = ?';
      queryParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(userId);

    // Update user
    const [result] = await pool.execute<ResultSetHeader>(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { 
        error: 'Failed to update user',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = parseInt(id);

    // Prevent admin from deleting their own account
    if (userId === user.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
