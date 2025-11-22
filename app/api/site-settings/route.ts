import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Fetch public site settings (no auth required)
export async function GET() {
  try {
    const [settings] = await pool.execute<RowDataPacket[]>(
      'SELECT setting_key, setting_value FROM site_settings'
    );

    // Convert to key-value object
    const settingsObj: Record<string, string> = {};
    settings.forEach((setting: any) => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    return NextResponse.json({ settings: settingsObj });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    // Return default values if table doesn't exist yet
    return NextResponse.json({
      settings: {
        whatsapp_number: '+231888293976',
        whatsapp_link: 'https://wa.me/231888293976',
        facebook_messenger_link: '',
        facebook_messenger_enabled: 'false',
      },
    });
  }
}
