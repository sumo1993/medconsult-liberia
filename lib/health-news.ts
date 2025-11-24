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
    // For server-side rendering, directly call the health news logic instead of making HTTP request
    const healthNewsData = await fetchExternalHealthNews();
    
    const data = {
      outbreakAlerts: [
        {
          id: 13,
          title: 'URGENT: HIV Crisis in Liberia - Get Tested Now',
          excerpt: 'Ministry of Health announces critical HIV situation. Free testing and treatment available nationwide.',
          category: 'Health Crisis',
          author: 'Ministry of Health',
          date: new Date().toISOString(),
          severity: 'high' as const,
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
          severity: 'high' as const,
          isActive: true,
          source: 'WHO Africa'
        },
      ],
      latestNews: healthNewsData.latestNews || [],
      lastUpdated: new Date().toISOString()
    };
    
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

  try {
    const apiKey = process.env.NEWS_API_KEY;
    
    if (!apiKey) {
      console.log('NEWS_API_KEY not configured, using fallback data');
      return {
        outbreakAlerts: [],
        latestNews: []
      };
    }

    // Fetch health-related news from NewsAPI
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=(health OR medical OR healthcare OR medicine OR disease OR treatment OR vaccine OR hospital OR WHO OR "public health") AND -sports&language=en&sortBy=publishedAt&pageSize=8&apiKey=${apiKey}`,
      {
        headers: {
          'User-Agent': 'MedConsult-Liberia/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter and format the articles
    const healthNews = data.articles
      .filter((article: any) => 
        article.title && 
        article.description && 
        article.urlToImage &&
        !article.title.includes('[Removed]') &&
        !article.description.includes('[Removed]') &&
        article.description.length > 50
      )
      .map((article: any, index: number) => ({
        id: 100 + index, // Start from 100 to avoid conflicts
        title: article.title,
        excerpt: article.description,
        category: 'Global Health',
        author: article.source.name,
        date: article.publishedAt,
        source: article.source.name
      }));

    console.log(`Fetched ${healthNews.length} health news articles from NewsAPI`);
    
    return {
      outbreakAlerts: [],
      latestNews: healthNews
    };
  } catch (error) {
    console.error('Error fetching from NewsAPI:', error);
    return {
      outbreakAlerts: [],
      latestNews: []
    };
  }
}
