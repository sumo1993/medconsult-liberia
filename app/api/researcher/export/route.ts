import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'submissions';
    const format = searchParams.get('format') || 'csv';

    let data: any[] = [];
    let headers: string[] = [];

    if (type === 'submissions') {
      const [submissions] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          id, title, data_type, description, location, 
          date_collected, sample_count, status, notes, created_at
         FROM research_submissions 
         WHERE researcher_id = ?
         ORDER BY created_at DESC`,
        [user.userId]
      );
      data = submissions;
      headers = ['ID', 'Title', 'Data Type', 'Description', 'Location', 'Date Collected', 'Sample Count', 'Status', 'Notes', 'Created At'];
    } else if (type === 'entries') {
      const [entries] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          id, entry_type, location, entry_date, data_fields, status, created_at
         FROM research_data_entries 
         WHERE researcher_id = ?
         ORDER BY created_at DESC`,
        [user.userId]
      );
      
      // Flatten data_fields JSON
      data = entries.map((entry: any) => {
        let fields = {};
        try {
          fields = typeof entry.data_fields === 'string' 
            ? JSON.parse(entry.data_fields) 
            : entry.data_fields || [];
        } catch (e) {}
        
        return {
          ...entry,
          data_fields: Array.isArray(fields) 
            ? fields.map((f: any) => `${f.field_name}: ${f.value}`).join('; ')
            : JSON.stringify(fields),
        };
      });
      headers = ['ID', 'Entry Type', 'Location', 'Entry Date', 'Data Fields', 'Status', 'Created At'];
    }

    if (format === 'csv') {
      // Generate CSV
      const csvRows = [headers.join(',')];
      
      for (const row of data) {
        const values = Object.values(row).map(value => {
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvRows.push(values.join(','));
      }

      const csv = csvRows.join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // Return JSON
      return NextResponse.json({
        headers,
        data,
        exportedAt: new Date().toISOString(),
        totalRecords: data.length,
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}


