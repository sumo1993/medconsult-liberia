import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';
import { buildSurveyFormsPdf, parseSurveyTypesParam } from '@/lib/census-survey-print-forms';

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!['admin', 'management'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden — only admin and CEO (management) can download survey PDFs' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const typesParam = searchParams.get('types');
  const types = parseSurveyTypesParam(typesParam);

  try {
    const buf = buildSurveyFormsPdf(types);
    const filename = `medconsult-field-survey-forms-${new Date().toISOString().slice(0, 10)}.pdf`;
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    console.error('survey-pdf:', e);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
