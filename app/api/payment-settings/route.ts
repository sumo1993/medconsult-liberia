import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyAuth } from '@/lib/middleware';

// GET payment settings
export async function GET(request: NextRequest) {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM payment_settings ORDER BY id DESC LIMIT 1'
    );

    if (rows.length === 0) {
      // Return default settings if none exist
      return NextResponse.json({
        settings: {
          mobileMoneyEnabled: true,
          orangeMoneyNumber: '',
          orangeMoneyName: '',
          mtnNumber: '+231 888 293976',
          mtnName: '',
          bankTransferEnabled: false,
          bankName: '',
          accountName: '',
          accountNumber: '',
          swiftCode: '',
          branchName: '',
          internationalEnabled: false,
          paypalEmail: '',
          wiseEmail: '',
          westernUnionName: '',
          organizationName: 'MedConsult Liberia',
        }
      });
    }

    // MySQL returns JSON as object, not string
    const settings = typeof rows[0].settings_json === 'string' 
      ? JSON.parse(rows[0].settings_json)
      : rows[0].settings_json;
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment settings' },
      { status: 500 }
    );
  }
}

// POST/UPDATE payment settings
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const settings = await request.json();
    const settingsJson = JSON.stringify(settings);

    // Check if settings exist
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM payment_settings LIMIT 1'
    );

    if (existing.length > 0) {
      // Update existing settings
      await pool.execute(
        'UPDATE payment_settings SET settings_json = ?, updated_at = NOW() WHERE id = ?',
        [settingsJson, existing[0].id]
      );
    } else {
      // Insert new settings
      await pool.execute(
        'INSERT INTO payment_settings (settings_json) VALUES (?)',
        [settingsJson]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to save payment settings' },
      { status: 500 }
    );
  }
}
