import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    console.log('Running consultant_earnings migration...');
    
    // Check if columns exist
    const [columns]: any = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'consultant_earnings' 
      AND COLUMN_NAME IN ('website_fee', 'team_fee', 'notes')
    `);
    
    const existingCols = columns.map((c: any) => c.COLUMN_NAME);
    const results = [];
    
    if (!existingCols.includes('website_fee')) {
      await pool.execute(`ALTER TABLE consultant_earnings ADD COLUMN website_fee DECIMAL(10, 2) DEFAULT 0`);
      results.push('✅ Added website_fee');
    } else {
      results.push('✓ website_fee already exists');
    }
    
    if (!existingCols.includes('team_fee')) {
      await pool.execute(`ALTER TABLE consultant_earnings ADD COLUMN team_fee DECIMAL(10, 2) DEFAULT 0`);
      results.push('✅ Added team_fee');
    } else {
      results.push('✓ team_fee already exists');
    }
    
    if (!existingCols.includes('notes')) {
      await pool.execute(`ALTER TABLE consultant_earnings ADD COLUMN notes TEXT`);
      results.push('✅ Added notes');
    } else {
      results.push('✓ notes already exists');
    }
    
    // Allow NULL consultant_id
    await pool.execute(`
      ALTER TABLE consultant_earnings 
      MODIFY COLUMN consultant_id INT NULL
    `);
    results.push('✅ consultant_id set to allow NULL');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully',
      results 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      sqlMessage: error.sqlMessage 
    }, { status: 500 });
  }
}
