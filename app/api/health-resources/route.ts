import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type HealthResource = {
  id: number | string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'guide';
  category: string;
  url: string | null;
  file_name: string | null;
  file_size: string | null;
  created_at: string | null;
  source: 'database' | 'fallback';
};

const fallbackResources: HealthResource[] = [
  {
    id: 'fallback-1',
    title: 'World Health Organization (WHO)',
    description: 'Global health data and disease surveillance',
    type: 'link',
    category: 'Global Health',
    url: 'https://www.who.int/',
    file_name: null,
    file_size: null,
    created_at: null,
    source: 'fallback',
  },
  {
    id: 'fallback-2',
    title: 'Global Health Observatory (GHO)',
    description: 'WHO portal for health statistics',
    type: 'link',
    category: 'Data',
    url: 'https://www.who.int/data/gho',
    file_name: null,
    file_size: null,
    created_at: null,
    source: 'fallback',
  },
  {
    id: 'fallback-3',
    title: 'Demographic and Health Surveys (DHS)',
    description: 'Household surveys on health and demographics',
    type: 'link',
    category: 'Survey',
    url: 'https://dhsprogram.com/',
    file_name: null,
    file_size: null,
    created_at: null,
    source: 'fallback',
  },
  {
    id: 'fallback-4',
    title: 'Liberia Statistics - World Bank',
    description: 'Comprehensive development and health indicators for Liberia',
    type: 'link',
    category: 'Liberia',
    url: 'https://data.worldbank.org/country/liberia',
    file_name: null,
    file_size: null,
    created_at: null,
    source: 'fallback',
  },
];

export async function GET() {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, title, description, type, category, url, file_name, file_size, created_at
       FROM research_resources
       WHERE is_public = TRUE
       ORDER BY created_at DESC`
    );

    const resources: HealthResource[] = (rows || []).map((row) => ({
      id: row.id,
      title: row.title || 'Untitled Resource',
      description: row.description || 'No description available.',
      type: (row.type || 'document') as HealthResource['type'],
      category: row.category || 'General',
      url: row.url || null,
      file_name: row.file_name || null,
      file_size: row.file_size || null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
      source: 'database',
    }));

    return NextResponse.json({
      success: true,
      source: 'database',
      count: resources.length,
      resources,
    });
  } catch (error: any) {
    const code = String(error?.code || '');
    const message = String(error?.message || '');
    const missingTable =
      code === '42P01' ||
      code === 'ER_NO_SUCH_TABLE' ||
      /doesn'?t exist|relation .* does not exist/i.test(message);

    if (!missingTable) {
      console.error('[Health Resources API] Failed to fetch DB resources:', error);
    }

    return NextResponse.json({
      success: true,
      source: 'fallback',
      count: fallbackResources.length,
      resources: fallbackResources,
      warning: missingTable ? 'research_resources table not found. Returned fallback resources.' : 'Returned fallback resources.',
    });
  }
}

