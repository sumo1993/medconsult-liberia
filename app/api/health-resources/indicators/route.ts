import { NextResponse } from 'next/server';

const WORLD_BANK_BASE = 'https://api.worldbank.org/v2';

const indicatorDefinitions = [
  { code: 'SP.DYN.LE00.IN', label: 'Life Expectancy (Years)', unit: 'years' },
  { code: 'SP.DYN.IMRT.IN', label: 'Infant Mortality (per 1,000 live births)', unit: 'per 1,000' },
  { code: 'SH.STA.MMRT', label: 'Maternal Mortality (per 100,000 live births)', unit: 'per 100,000' },
  { code: 'SH.DYN.MORT', label: 'Under-5 Mortality (per 1,000 live births)', unit: 'per 1,000' },
  { code: 'SH.XPD.CHEX.GD.ZS', label: 'Health Expenditure (% of GDP)', unit: '%' },
  { code: 'SH.IMM.MEAS', label: 'Measles Immunization Coverage (%)', unit: '%' },
];

async function fetchJsonWithTlsFallback(url: string) {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MedConsult-Liberia/1.0',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (firstError: any) {
    const previousTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    try {
      // Local fallback for environments with strict/self-signed TLS interception.
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MedConsult-Liberia/1.0',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (secondError: any) {
      throw new Error(
        `Network fetch failed (${firstError?.message || 'unknown'}) / TLS-relaxed retry failed (${secondError?.message || 'unknown'})`
      );
    } finally {
      if (typeof previousTls === 'undefined') {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      } else {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTls;
      }
    }
  }
}

async function fetchLatestIndicator(countryCode: string, indicatorCode: string) {
  const url = `${WORLD_BANK_BASE}/country/${countryCode}/indicator/${indicatorCode}?format=json&mrnev=1&per_page=10`;
  const payload = await fetchJsonWithTlsFallback(url);
  const rows = Array.isArray(payload?.[1]) ? payload[1] : [];
  const latest = rows.find((row: any) => row && row.value !== null && row.value !== undefined);

  return {
    value: latest?.value ?? null,
    year: latest?.date ?? null,
  };
}

async function fetchCountryIndicators(countryCode: string, countryLabel: string) {
  const results = await Promise.all(
    indicatorDefinitions.map(async (def) => {
      try {
        const latest = await fetchLatestIndicator(countryCode, def.code);
        return {
          code: def.code,
          label: def.label,
          unit: def.unit,
          value: latest.value,
          year: latest.year,
          status: latest.value === null ? 'no-data' : 'ok',
        };
      } catch (error: any) {
        return {
          code: def.code,
          label: def.label,
          unit: def.unit,
          value: null,
          year: null,
          status: 'error',
          error: error?.message || 'Failed to fetch indicator',
        };
      }
    })
  );

  const errorCount = results.filter((item) => item.status === 'error').length;

  return {
    countryCode,
    countryLabel,
    indicators: results,
    errorCount,
  };
}

function countAvailable(indicators: Array<{ value: number | null }>) {
  return indicators.filter((item) => item.value !== null && item.value !== undefined).length;
}

export async function GET() {
  try {
    const [domestic, international] = await Promise.all([
      fetchCountryIndicators('LBR', 'Liberia'),
      fetchCountryIndicators('WLD', 'World'),
    ]);

    return NextResponse.json({
      success: true,
      domestic: {
        ...domestic,
        availableIndicators: countAvailable(domestic.indicators),
      },
      international: {
        ...international,
        availableIndicators: countAvailable(international.indicators),
      },
      source: 'World Bank Open Data',
      warning:
        domestic.errorCount === domestic.indicators.length &&
        international.errorCount === international.indicators.length
          ? 'All indicator fetches failed due to network/TLS errors. Please check outbound internet access.'
          : null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Health Indicators API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch latest health indicators',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
