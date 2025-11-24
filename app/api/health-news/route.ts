import { NextRequest, NextResponse } from 'next/server';

// This API fetches health news from various sources
// In production, this would integrate with real news APIs like:
// - WHO RSS feeds
// - Ministry of Health Liberia API
// - News APIs (NewsAPI, Google News API)
// - Health data aggregators

export async function GET(request: NextRequest) {
  try {
    // Fetch real health news from NewsAPI
    const globalHealthNews = await fetchGlobalHealthNews();
    
    // Combine real news with static outbreak alerts
    const healthNews = {
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
      ],
      latestNews: globalHealthNews.length > 0 ? globalHealthNews : [
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
      ],
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(healthNews, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400', // Cache for 1 hour, revalidate daily
      },
    });
  } catch (error) {
    console.error('Error fetching health news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health news' },
      { status: 500 }
    );
  }
}

// Helper functions for fetching from real sources (to be implemented)
async function fetchWHONews() {
  // Fetch from WHO RSS feed or API
  // Example: https://www.who.int/feeds/entity/csr/don/en/rss.xml
  return [];
}

async function fetchLiberiaHealthNews() {
  // Fetch from Liberia Ministry of Health
  return [];
}

async function fetchGlobalHealthNews() {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    
    if (!apiKey) {
      console.log('NEWS_API_KEY not configured, using fallback data');
      return [];
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
        source: article.source.name,
        url: article.url
      }));

    console.log(`Fetched ${healthNews.length} health news articles from NewsAPI`);
    return healthNews;
  } catch (error) {
    console.error('Error fetching from NewsAPI:', error);
    return [];
  }
}
