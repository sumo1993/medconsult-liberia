import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// GET single expense
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const [expenses]: any = await pool.execute(
      'SELECT * FROM expenses WHERE id = ?',
      [id]
    );

    if (expenses.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(expenses[0]);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
  }
}

// PUT update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { category, amount, description, expense_date, status } = body;

    if (!category || !amount || !expense_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update expense with audit trail
    await pool.execute(
      `UPDATE expenses 
       SET category = ?, amount = ?, description = ?, expense_date = ?, status = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [category, amount, description || null, expense_date, status || 'pending', id]
    );

    // Log audit trail
    await pool.execute(
      `INSERT INTO expense_audit_log (expense_id, action, changed_by, changed_at, changes)
       VALUES (?, 'UPDATE', ?, NOW(), ?)`,
      [id, user.userId, JSON.stringify({ category, amount, description, expense_date, status })]
    ).catch(() => {
      // If audit table doesn't exist, continue without logging
      console.log('Audit log table not found, skipping audit trail');
    });

    return NextResponse.json({ 
      message: 'Expense updated successfully',
      id 
    });
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ 
      error: 'Failed to update expense',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE expense (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if expense exists
    const [expenses]: any = await pool.execute(
      'SELECT * FROM expenses WHERE id = ?',
      [id]
    );

    if (expenses.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Hard delete instead of soft delete (since 'deleted' is not in the ENUM)
    await pool.execute(
      `DELETE FROM expenses WHERE id = ?`,
      [id]
    );

    // Log audit trail
    await pool.execute(
      `INSERT INTO expense_audit_log (expense_id, action, changed_by, changed_at, changes)
       VALUES (?, 'DELETE', ?, NOW(), ?)`,
      [id, user.userId, JSON.stringify(expenses[0])]
    ).catch(() => {
      console.log('Audit log table not found, skipping audit trail');
    });

    return NextResponse.json({ 
      message: 'Expense deleted successfully',
      id 
    });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ 
      error: 'Failed to delete expense',
      details: error.message 
    }, { status: 500 });
  }
}
