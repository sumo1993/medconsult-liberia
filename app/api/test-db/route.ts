import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const [rows] = await pool.execute('SELECT 1 + 1 AS result');
    
    // Get table count
    const [tables] = await pool.execute('SHOW TABLES');
    
    // Get contact messages count
    const [messageCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM contact_messages'
    );
    
    // Get appointments count
    const [appointmentCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM appointments'
    );
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      database: process.env.DB_NAME,
      tables: tables,
      stats: {
        contactMessages: (messageCount as any)[0].count,
        appointments: (appointmentCount as any)[0].count,
      },
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
