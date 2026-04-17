import { jsPDF } from 'jspdf';

export type PrintableSurveyType =
  | 'malaria'
  | 'health'
  | 'maternal_child_health'
  | 'wash'
  | 'nutrition';

export const PRINTABLE_SURVEY_TYPES: PrintableSurveyType[] = [
  'malaria',
  'health',
  'maternal_child_health',
  'wash',
  'nutrition',
];

const SURVEY_TITLES: Record<PrintableSurveyType, string> = {
  malaria: 'Malaria (household) survey',
  health: 'General health survey',
  maternal_child_health: 'Maternal & child health survey',
  wash: 'WASH survey (water, sanitation, hygiene)',
  nutrition: 'Nutrition survey',
};

type FieldRow = { label: string; hint?: string };

function commonLocationBlock(): FieldRow[] {
  return [
    { label: 'Date of visit (YYYY-MM-DD)' },
    { label: 'Collector / enumerator name' },
    { label: 'County' },
    { label: 'District' },
    { label: 'Community' },
    { label: 'Electoral district (NEC id, e.g. MED-12)' },
    { label: 'Location landmark / description (if GPS unavailable)' },
    { label: 'GPS latitude' },
    { label: 'GPS longitude' },
    { label: 'Additional notes' },
  ];
}

function surveySpecificFields(type: PrintableSurveyType): FieldRow[] {
  const baseCounts: FieldRow[] = [{ label: 'Households surveyed' }];

  switch (type) {
    case 'malaria':
      return [
        ...baseCounts,
        { label: 'Suspected malaria cases' },
        { label: 'Fever cases (last 2 weeks)' },
        { label: 'Children under 5 (count)' },
        { label: 'Pregnant women (count)' },
        { label: 'Mark as urgent alert? (yes / no)' },
      ];
    case 'health':
      return [
        ...baseCounts,
        { label: 'Diarrhea cases' },
        { label: 'Respiratory cases' },
        { label: 'Fever cases' },
        { label: 'Clinic visits' },
      ];
    case 'maternal_child_health':
      return [
        ...baseCounts,
        { label: 'Pregnant women' },
        { label: 'Antenatal visits' },
        { label: 'Facility births' },
        { label: 'Home births' },
      ];
    case 'wash':
      return [
        ...baseCounts,
        {
          label: 'Primary water source',
          hint: 'well, river, piped, borehole, rainwater, spring, vendor (circle one)',
        },
        {
          label: 'Toilet type',
          hint: 'pit latrine, flush, none, VIP latrine, composting (circle one)',
        },
        { label: 'Handwashing facility available? (yes / no)' },
      ];
    case 'nutrition':
      return [
        ...baseCounts,
        { label: 'Children screened' },
        { label: 'Malnourished children' },
        { label: 'Households with food shortage' },
      ];
    default:
      return baseCounts;
  }
}

function addWrapped(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

/**
 * Multi-page PDF: one section per survey type, blank lines for paper entry.
 * Matches field names used in the digital field submission form.
 */
export function buildSurveyFormsPdf(types: PrintableSurveyType[]): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const maxW = pageW - margin * 2;
  let y = margin;
  const lh = 5;
  const titleLh = 7;

  const newPage = () => {
    doc.addPage();
    y = margin;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) newPage();
  };

  let ordered = types.filter((t) => PRINTABLE_SURVEY_TYPES.includes(t));
  if (ordered.length === 0) {
    ordered = [...PRINTABLE_SURVEY_TYPES];
  }

  // Cover
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MedConsult Liberia', margin, y);
  y += titleLh + 2;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  y = addWrapped(
    doc,
    'Field / census survey forms — paper copy for offline collection. Transfer answers into the digital app when online.',
    margin,
    y,
    maxW,
    lh
  );
  y += 4;
  y = addWrapped(
    doc,
    `Included forms: ${ordered.map((t) => SURVEY_TITLES[t] || t).join(' · ')}`,
    margin,
    y,
    maxW,
    lh
  );
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(80);
  y = addWrapped(doc, `Generated ${new Date().toLocaleString('en-LR', { timeZone: 'Africa/Monrovia' })} (Monrovia time)`, margin, y, maxW, lh);
  doc.setTextColor(0);
  y += 8;

  for (let i = 0; i < ordered.length; i++) {
    const st = ordered[i];
    if (i > 0 || y > pageH - 40) newPage();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    ensureSpace(28);
    doc.text(SURVEY_TITLES[st] || st, margin, y);
    y += titleLh;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    y = addWrapped(
      doc,
      'Use one form per visit. Keep handwriting clear. Enumerator signs below.',
      margin,
      y,
      maxW,
      lh
    );
    y += 4;

    doc.setFontSize(10);
    const allRows: FieldRow[] = [...commonLocationBlock(), ...surveySpecificFields(st)];

    for (const row of allRows) {
      ensureSpace(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${row.label}:`, margin, y);
      y += lh;
      doc.setFont('helvetica', 'normal');
      if (row.hint) {
        y = addWrapped(doc, row.hint, margin + 2, y, maxW - 2, lh);
        y += 1;
      }
      doc.setDrawColor(180);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
    }

    ensureSpace(12);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    y = addWrapped(doc, 'Enumerator signature: _________________________   Date: _______________', margin, y, maxW, lh);
    y += 10;
    doc.setFont('helvetica', 'normal');
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`MedConsult Liberia · Page ${p} of ${totalPages}`, margin, pageH - 8);
    doc.setTextColor(0);
  }

  const out = doc.output('arraybuffer');
  return Buffer.from(out);
}

export function parseSurveyTypesParam(param: string | null): PrintableSurveyType[] {
  if (!param || param.toLowerCase() === 'all') {
    return [...PRINTABLE_SURVEY_TYPES];
  }
  const parts = param.split(',').map((s) => s.trim().toLowerCase());
  const set = new Set<PrintableSurveyType>();
  for (const p of parts) {
    if (PRINTABLE_SURVEY_TYPES.includes(p as PrintableSurveyType)) {
      set.add(p as PrintableSurveyType);
    }
  }
  return set.size ? Array.from(set) : [...PRINTABLE_SURVEY_TYPES];
}
