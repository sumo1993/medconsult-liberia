import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// PUT - Update team member
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = context.params instanceof Promise ? await context.params : context.params;
  
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, role, specialization, bio, photo, email, phone, linkedin, facebook, display_order, status } = body;

    await pool.execute(
      `UPDATE team_members 
       SET name = ?, role = ?, specialization = ?, bio = ?, photo = ?, email = ?, phone = ?, linkedin = ?, facebook = ?, display_order = ?, status = ?
       WHERE id = ?`,
      [name, role, specialization, bio, photo, email, phone, linkedin, facebook, display_order, status, params.id]
    );

    return NextResponse.json({ 
      success: true,
      message: 'Team member updated successfully'
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE - Delete team member
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = context.params instanceof Promise ? await context.params : context.params;
  
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await pool.execute('DELETE FROM team_members WHERE id = ?', [params.id]);

    return NextResponse.json({ 
      success: true,
      message: 'Team member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}
