import { NextRequest, NextResponse } from 'next/server';

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
};

const HEALTH_KEYWORDS = [
  'health',
  'disease',
  'hospital',
  'vaccine',
  'vaccination',
  'outbreak',
  'cholera',
  'malaria',
  'maternal',
  'child',
  'public health',
  'medical',
  'medicine',
  'ebola',
  'clinic',
  'who',
  'ministry of health',
];

const DOMESTIC_KEYWORDS = [
  'liberia',
  'monrovia',
  'moh',
  'ministry of health',
  'county health team',
  'bong',
  'nimba',
  'montserrado',
  'grand bassa',
  'margibi',
];

const DOMESTIC_FEEDS = [
  {
    source: 'Liberia Health (Google News)',
    url: 'https://news.google.com/rss/search?q=Liberia+Ministry+of+Health+OR+Liberia+health&hl=en-US&gl=US&ceid=US:en',
  },
  {
    source: 'MOH Liberia (Google News)',
    url: 'https://news.google.com/rss/search?q=site:moh.gov.lr+health&hl=en-US&gl=US&ceid=US:en',
  },
];

const INTERNATIONAL_FEEDS = [
  {
    source: 'WHO (Google News)',
    url: 'https://news.google.com/rss/search?q=site:who.int+health+OR+WHO+health&hl=en-US&gl=US&ceid=US:en',
  },
  {
    source: 'WHO Outbreak (Google News)',
    url: 'https://news.google.com/rss/search?q=site:who.int+\"disease+outbreak+news\"&hl=en-US&gl=US&ceid=US:en',
  },
  { source: 'BBC Health', url: 'https://feeds.bbci.co.uk/news/health/rss.xml' },
  {
    source: 'CNN Health (Google News)',
    url: 'https://news.google.com/rss/search?q=site:cnn.com+health&hl=en-US&gl=US&ceid=US:en',
  },
];

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function extractTag(itemXml: string, tag: string): string {
  const match = itemXml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeEntities(match[1]) : '';
}

function parseRss(xml: string, source: string, limit = 8): NewsItem[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return items.slice(0, limit).map((raw) => ({
    title: extractTag(raw, 'title') || 'Untitled',
    link: extractTag(raw, 'link') || '#',
    pubDate: extractTag(raw, 'pubDate') || new Date().toUTCString(),
    source,
  }));
}

function normalizeForDedup(value: string) {
  return value.toLowerCase().replace(/https?:\/\//g, '').replace(/[^\w]+/g, ' ').trim();
}

function isHealthRelated(item: NewsItem) {
  const haystack = `${item.title} ${item.source}`.toLowerCase();
  return HEALTH_KEYWORDS.some((k) => haystack.includes(k));
}

function isDomesticRelated(item: NewsItem) {
  const haystack = `${item.title} ${item.source} ${item.link}`.toLowerCase();
  return DOMESTIC_KEYWORDS.some((k) => haystack.includes(k));
}

function smartFilter(items: NewsItem[], mode: 'domestic' | 'international') {
  const deduped: NewsItem[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (!item.title || !item.link) continue;
    const fromWho = item.source.toLowerCase().includes('who');
    if (!fromWho && !isHealthRelated(item)) continue;
    if (mode === 'domestic' && !isDomesticRelated(item)) continue;

    const key = `${normalizeForDedup(item.title)}|${normalizeForDedup(item.link)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'MedConsult-Liberia/1.0',
      },
    });
  } catch (firstError: any) {
    const previousTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    try {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      response = await fetch(url, {
        cache: 'no-store',
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'MedConsult-Liberia/1.0',
        },
      });
    } catch (secondError: any) {
      throw new Error(
        `${source} feed failed: ${firstError?.message || 'network error'} / TLS-relaxed retry failed: ${secondError?.message || 'network error'}`
      );
    } finally {
      if (typeof previousTls === 'undefined') {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      } else {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTls;
      }
    }
  }

  if (!response.ok) {
    throw new Error(`${source} feed failed with status ${response.status}`);
  }

  const xml = await response.text();
  return parseRss(xml, source, 8);
}

function toTime(value: string) {
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get('limit') || '50');
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 10), 100) : 50;

  const domesticResults = await Promise.allSettled(
    DOMESTIC_FEEDS.map((feed) => fetchFeed(feed.url, feed.source))
  );

  const internationalResults = await Promise.allSettled(
    INTERNATIONAL_FEEDS.map((feed) => fetchFeed(feed.url, feed.source))
  );

  const rawDomestic = domesticResults
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .sort((a, b) => toTime(b.pubDate) - toTime(a.pubDate));

  const rawInternational = internationalResults
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .sort((a, b) => toTime(b.pubDate) - toTime(a.pubDate));

  const domestic = smartFilter(rawDomestic, 'domestic').slice(0, limit);
  const international = smartFilter(rawInternational, 'international').slice(0, limit);
  const domesticErrors = domesticResults
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => String(r.reason?.message || r.reason || 'domestic feed failed'));
  const internationalErrors = internationalResults
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => String(r.reason?.message || r.reason || 'international feed failed'));

  return NextResponse.json({
    success: true,
    domestic,
    international,
    totalDomestic: domestic.length,
    totalInternational: international.length,
    diagnostics: {
      domesticErrors,
      internationalErrors,
    },
    fetchedAt: new Date().toISOString(),
  });
}
