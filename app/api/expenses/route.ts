import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

// Ensure expenses table exists
async function ensureExpensesTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        expense_date DATE NOT NULL,
        receipt_url VARCHAR(255),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_by INT,
        approved_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_expense_date (expense_date),
        INDEX idx_status (status),
        INDEX idx_category (category)
      )
    `);
  } catch (error) {
    console.error('Error ensuring expenses table:', error);
  }
}

// GET all expenses
export async function GET(request: NextRequest) {
  try {
    await ensureExpensesTable(); // Ensure table exists
    
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let sql = `
      SELECT e.*, 
             u1.full_name as created_by_name,
             u2.full_name as approved_by_name
      FROM expenses e
      LEFT JOIN users u1 ON e.created_by = u1.id
      LEFT JOIN users u2 ON e.approved_by = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    if (startDate) {
      sql += ' AND e.expense_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND e.expense_date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY e.expense_date DESC';

    const [expenses] = await pool.execute(sql, params);
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

// POST create new expense
export async function POST(request: NextRequest) {
  try {
    await ensureExpensesTable(); // Ensure table exists
    
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Expense request body:', body);
    const { category, amount, description, expense_date, receipt_url, status = 'approved' } = body;

    if (!category || !amount || !expense_date) {
      return NextResponse.json({ error: 'Missing required fields: category, amount, expense_date' }, { status: 400 });
    }

    console.log('Creating expense with:', { category, amount, description, expense_date, receipt_url, status, userId: user.userId });

    const [result]: any = await pool.execute(
      `INSERT INTO expenses 
       (category, amount, description, expense_date, receipt_url, status, created_by, approved_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [category, amount, description || null, expense_date, receipt_url || null, status, user.userId, 
       status === 'approved' ? user.userId : null]
    );

    console.log('Expense created successfully with ID:', result.insertId);

    return NextResponse.json({ 
      message: 'Expense created successfully',
      id: result.insertId 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    return NextResponse.json({ 
      error: 'Failed to create expense',
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}
