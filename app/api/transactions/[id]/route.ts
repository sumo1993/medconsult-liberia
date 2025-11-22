import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

// GET single transaction
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
    const [transactions]: any = await pool.execute(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(transactions[0]);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}

// PUT update transaction
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
    const {
      transaction_type,
      amount,
      description,
      consultant_id,
      payment_method,
      transaction_date,
      receipt_photo
    } = body;

    if (!transaction_type || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Handle photo upload if provided
    let receiptPath = null;
    if (receipt_photo && receipt_photo.startsWith('data:image')) {
      const base64Data = receipt_photo.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `transaction-${id}-${Date.now()}.jpg`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
      receiptPath = `/uploads/receipts/${fileName}`;
      
      try {
        await writeFile(path.join(uploadDir, fileName), buffer);
      } catch (err) {
        console.error('Error saving receipt:', err);
      }
    }

    // Update transaction
    const updateFields = [
      'transaction_type = ?',
      'amount = ?',
      'description = ?',
      'consultant_id = ?',
      'payment_method = ?',
      'transaction_date = ?',
      'updated_at = NOW()'
    ];
    
    const updateValues = [
      transaction_type,
      amount,
      description || null,
      consultant_id || null,
      payment_method,
      transaction_date
    ];

    if (receiptPath) {
      updateFields.push('receipt_photo = ?');
      updateValues.push(receiptPath);
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return NextResponse.json({ 
      message: 'Transaction updated successfully',
      id,
      receipt_photo: receiptPath
    });
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ 
      error: 'Failed to update transaction',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE transaction
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

    // Check if transaction exists
    const [transactions]: any = await pool.execute(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Delete associated consultant earnings if any
    await pool.execute(
      'DELETE FROM consultant_earnings WHERE transaction_id = ?',
      [id]
    );

    // Delete receipt photo if exists
    if (transactions[0].receipt_photo) {
      try {
        const photoPath = path.join(process.cwd(), 'public', transactions[0].receipt_photo);
        await unlink(photoPath);
      } catch (err) {
        console.log('Receipt photo not found or already deleted');
      }
    }

    // Delete transaction
    await pool.execute(
      'DELETE FROM transactions WHERE id = ?',
      [id]
    );

    return NextResponse.json({ 
      message: 'Transaction deleted successfully',
      id 
    });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ 
      error: 'Failed to delete transaction',
      details: error.message 
    }, { status: 500 });
  }
}
