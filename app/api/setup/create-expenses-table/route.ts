import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Create expenses table
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

    // Try to add foreign keys (may fail if already exist)
    try {
      await pool.execute(`
        ALTER TABLE expenses 
        ADD CONSTRAINT fk_expenses_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (err: any) {
      if (err.code !== 'ER_DUP_KEYNAME') {
        console.log('Foreign key created_by note:', err.message);
      }
    }

    try {
      await pool.execute(`
        ALTER TABLE expenses 
        ADD CONSTRAINT fk_expenses_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (err: any) {
      if (err.code !== 'ER_DUP_KEYNAME') {
        console.log('Foreign key approved_by note:', err.message);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Expenses table created successfully!' 
    });

  } catch (error: any) {
    console.error('Error creating expenses table:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
