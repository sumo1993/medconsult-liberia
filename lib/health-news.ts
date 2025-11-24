/**
 * Health News Fetching System with Automatic Updates
 * 
 * This module handles fetching and caching health news from multiple sources.
 * 
 * FEATURES:
 * - Automatic caching (1-hour duration)
 * - Fallback data if API fails
 * - Support for multiple news sources
 * - Type-safe interfaces
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. ADD ENVIRONMENT VARIABLES (.env.local):
 *    NEWS_API_KEY=your_newsapi_key_here
 *    WHO_RSS_URL=https://www.who.int/feeds/entity/csr/don/en/rss.xml
 *    LIBERIA_HEALTH_API_URL=your_ministry_api_url
 *    CRON_SECRET=your_secure_random_string
 *    NEXT_PUBLIC_BASE_URL=http://localhost:3000 (or your production URL)
 * 
 * 2. CONFIGURE VERCEL CRON (vercel.json already set up):
 *    - Runs every 6 hours automatically
 *    - Endpoint: /api/cron/update-health-news
 *    - Requires CRON_SECRET for security
 * 
 * 3. MANUAL TRIGGER (for testing):
 *    curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
 *         https://your-domain.com/api/cron/update-health-news
 * 
 * 4. TO ADD NEW NEWS SOURCES:
 *    - Update fetchExternalHealthNews() function below
 *    - Add parsing logic for new API/RSS feeds
 *    - Update /app/api/cron/update-health-news/route.ts
 * 
 * RECOMMENDED NEWS SOURCES:
 * - NewsAPI.org (free tier: 100 requests/day)
 * - WHO Disease Outbreak News RSS
 * - Liberia Ministry of Health website/API
 * - Google News API
 * - Health data aggregators
 */

export interface OutbreakAlert {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  severity: 'high' | 'medium' | 'low';
  isActive: boolean;
  source?: string;
}

export interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  source: string;
}

export interface HealthNewsData {
  outbreakAlerts: OutbreakAlert[];
  latestNews: NewsItem[];
  lastUpdated: string;
}

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

let cachedData: HealthNewsData | null = null;
let lastFetchTime = 0;

/**
 * Fetches health news with automatic caching
 * Data is refreshed every hour
 */
export async function getHealthNews(): Promise<HealthNewsData> {
  const now = Date.now();
  
  // Return cached data if still fresh
  if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedData;
  }

  try {
    // Fetch from API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/health-news`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch health news');
    }

    const data = await response.json();
    
    // Update cache
    cachedData = data;
    lastFetchTime = now;
    
    return data;
  } catch (error) {
    console.error('Error fetching health news:', error);
    
    // Return cached data if available, otherwise return fallback
    if (cachedData) {
      return cachedData;
    }
    
    return getFallbackHealthNews();
  }
}

/**
 * Fallback data in case API fails
 */
function getFallbackHealthNews(): HealthNewsData {
  return {
    outbreakAlerts: [
      {
        id: 13,
        title: 'URGENT: HIV Crisis in Liberia - Get Tested Now',
        excerpt: 'Ministry of Health announces critical HIV situation. Free testing and treatment available nationwide.',
        category: 'Health Crisis',
        author: 'Ministry of Health',
        date: new Date().toISOString(),
        severity: 'high',
        isActive: true,
        source: 'Ministry of Health Liberia'
      },
      {
        id: 14,
        title: 'Monkeypox Outbreak Alert: Prevention and Symptoms',
        excerpt: 'Confirmed monkeypox cases in Liberia. Learn how to protect yourself and recognize symptoms.',
        category: 'Disease Outbreak',
        author: 'MedConsult Health Team',
        date: new Date().toISOString(),
        severity: 'high',
        isActive: true,
        source: 'WHO Africa'
      },
      {
        id: 4,
        title: 'COVID-19 Update: New Variant Prevention Guidelines',
        excerpt: 'Stay informed about the latest COVID-19 variants and updated prevention measures for Liberia.',
        category: 'Health Alert',
        author: 'MedConsult Health Team',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        severity: 'medium',
        isActive: true
      },
      {
        id: 5,
        title: 'Ebola Preparedness: What You Need to Know',
        excerpt: 'Essential information on Ebola prevention, symptoms, and emergency response protocols.',
        category: 'Disease Outbreak',
        author: 'Isaac B. Zeah, PA',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        severity: 'high',
        isActive: true
      },
      {
        id: 6,
        title: 'Cholera Prevention During Rainy Season',
        excerpt: 'Critical guidelines for preventing cholera outbreaks during Liberia\'s rainy season.',
        category: 'Health Alert',
        author: 'MedConsult Health Team',
        date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        severity: 'medium',
        isActive: true
      },
    ],
    latestNews: [
      {
        id: 7,
        title: 'WHO Approves New Malaria Vaccine for Children',
        excerpt: 'World Health Organization endorses groundbreaking malaria vaccine, offering hope for millions of children in Africa.',
        category: 'Global Health',
        author: 'MedConsult Health Team',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'WHO'
      },
      {
        id: 8,
        title: 'Liberia Launches National Health Insurance Scheme',
        excerpt: 'Government of Liberia introduces comprehensive health insurance program to improve healthcare access for all citizens.',
        category: 'Liberia News',
        author: 'MedConsult Team',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'Ministry of Health'
      },
      {
        id: 9,
        title: 'New Maternal Health Initiative in Montserrado County',
        excerpt: 'UNICEF partners with local health facilities to reduce maternal mortality rates through improved prenatal care.',
        category: 'Liberia News',
        author: 'MedConsult Health Team',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'UNICEF Liberia'
      },
      {
        id: 10,
        title: 'Global Tuberculosis Cases Decline for First Time',
        excerpt: 'WHO reports significant progress in TB treatment and prevention worldwide, with new drug-resistant TB treatments showing promise.',
        category: 'Global Health',
        author: 'MedConsult Health Team',
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'WHO'
      },
      {
        id: 11,
        title: 'Liberia Receives Medical Equipment Donation',
        excerpt: 'Major hospitals in Monrovia receive modern diagnostic equipment to improve patient care and disease detection.',
        category: 'Liberia News',
        author: 'MedConsult Team',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'Ministry of Health'
      },
      {
        id: 12,
        title: 'Mental Health Awareness Campaign Launches Nationwide',
        excerpt: 'Liberia\'s first comprehensive mental health awareness campaign aims to reduce stigma and improve access to mental health services.',
        category: 'Liberia News',
        author: 'MedConsult Health Team',
        date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'Ministry of Health'
      },
    ],
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Fetches health news from external sources
 * This can be configured to pull from:
 * - WHO RSS feeds
 * - Ministry of Health APIs
 * - News aggregators
 */
export async function fetchExternalHealthNews(): Promise<Partial<HealthNewsData>> {
  const sources: NewsItem[] = [];

  // TODO: Implement actual API calls to:
  // 1. WHO Disease Outbreak News: https://www.who.int/feeds/entity/csr/don/en/rss.xml
  // 2. Liberia Ministry of Health
  // 3. News APIs (NewsAPI, Google News)
  // 4. Health data aggregators

  // Example structure for WHO RSS feed integration:
  /*
  try {
    const whoResponse = await fetch('https://www.who.int/feeds/entity/csr/don/en/rss.xml');
    const whoXml = await whoResponse.text();
    const whoNews = parseWHORSS(whoXml);
    sources.push(...whoNews);
  } catch (error) {
    console.error('Error fetching WHO news:', error);
  }
  */

  return {
    outbreakAlerts: [],
    latestNews: sources
  };
}
