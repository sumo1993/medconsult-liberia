/**
 * Blog & News Page with Automatic Health Updates
 * 
 * This page automatically fetches and displays:
 * - Disease outbreak alerts (HIV, Monkeypox, Ebola, COVID-19, Cholera)
 * - Latest health news from Liberia and global sources
 * - Health tips and medical insights
 * 
 * AUTOMATIC UPDATE SYSTEM:
 * - Data refreshes every hour (revalidate: 3600 seconds)
 * - Cron job runs every 6 hours to fetch new health news
 * - Users can manually refresh using the refresh button
 * - Cached data ensures fast page loads
 * 
 * TO ADD NEW NEWS SOURCES:
 * 1. Update /lib/health-news.ts with new API integrations
 * 2. Configure API keys in environment variables
 * 3. Update /app/api/cron/update-health-news/route.ts
 * 
 * SUPPORTED NEWS SOURCES:
 * - WHO Disease Outbreak News (RSS)
 * - Liberia Ministry of Health
 * - NewsAPI for global health news
 * - Custom health data aggregators
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, User, ArrowRight, BookOpen, ExternalLink, Database, TrendingUp, AlertTriangle, Shield, Globe, Newspaper, Heart, RefreshCw } from 'lucide-react';
import { getHealthNews, OutbreakAlert, NewsItem } from '@/lib/health-news';
import BlogClient from './BlogClient';

// Revalidate every hour (3600 seconds) - Next.js ISR
export const revalidate = 3600;

export default async function BlogPage() {
  // Fetch health news data with automatic updates
  const healthNewsData = await getHealthNews();

  // Use fetched data or fallback to static data
  const outbreakAlerts: OutbreakAlert[] = healthNewsData.outbreakAlerts.length > 0 ? healthNewsData.outbreakAlerts : [
    {
      id: 13,
      title: 'URGENT: HIV Crisis in Liberia - Get Tested Now',
      excerpt: 'Ministry of Health announces critical HIV situation. Free testing and treatment available nationwide.',
      category: 'Health Crisis',
      author: 'Ministry of Health',
      date: '2024-11-23',
      severity: 'high',
      isActive: true
    },
    {
      id: 14,
      title: 'Monkeypox Outbreak Alert: Prevention and Symptoms',
      excerpt: 'Confirmed monkeypox cases in Liberia. Learn how to protect yourself and recognize symptoms.',
      category: 'Disease Outbreak',
      author: 'MedConsult Health Team',
      date: '2024-11-23',
      severity: 'high',
      isActive: true
    },
    {
      id: 4,
      title: 'COVID-19 Update: New Variant Prevention Guidelines',
      excerpt: 'Stay informed about the latest COVID-19 variants and updated prevention measures for Liberia.',
      category: 'Health Alert',
      author: 'MedConsult Health Team',
      date: '2024-11-20',
      severity: 'medium',
      isActive: true
    },
    {
      id: 5,
      title: 'Ebola Preparedness: What You Need to Know',
      excerpt: 'Essential information on Ebola prevention, symptoms, and emergency response protocols.',
      category: 'Disease Outbreak',
      author: 'Isaac B. Zeah, PA',
      date: '2024-11-18',
      severity: 'high',
      isActive: true
    },
    {
      id: 6,
      title: 'Cholera Prevention During Rainy Season',
      excerpt: 'Critical guidelines for preventing cholera outbreaks during Liberia\'s rainy season.',
      category: 'Health Alert',
      author: 'MedConsult Health Team',
      date: '2024-11-12',
      severity: 'medium',
      isActive: true
    },
  ];

  // Latest News - Liberia & World Health Updates
  const latestNews: NewsItem[] = healthNewsData.latestNews.length > 0 ? healthNewsData.latestNews : [
    {
      id: 7,
      title: 'WHO Approves New Malaria Vaccine for Children',
      excerpt: 'World Health Organization endorses groundbreaking malaria vaccine, offering hope for millions of children in Africa.',
      category: 'Global Health',
      author: 'MedConsult Health Team',
      date: '2024-11-22',
      source: 'WHO'
    },
    {
      id: 8,
      title: 'Liberia Launches National Health Insurance Scheme',
      excerpt: 'Government of Liberia introduces comprehensive health insurance program to improve healthcare access for all citizens.',
      category: 'Liberia News',
      author: 'MedConsult Team',
      date: '2024-11-21',
      source: 'Ministry of Health'
    },
    {
      id: 9,
      title: 'New Maternal Health Initiative in Montserrado County',
      excerpt: 'UNICEF partners with local health facilities to reduce maternal mortality rates through improved prenatal care.',
      category: 'Liberia News',
      author: 'MedConsult Health Team',
      date: '2024-11-19',
      source: 'UNICEF Liberia'
    },
    {
      id: 10,
      title: 'Global Tuberculosis Cases Decline for First Time',
      excerpt: 'WHO reports significant progress in TB treatment and prevention worldwide, with new drug-resistant TB treatments showing promise.',
      category: 'Global Health',
      author: 'MedConsult Health Team',
      date: '2024-11-17',
      source: 'WHO'
    },
    {
      id: 11,
      title: 'Liberia Receives Medical Equipment Donation',
      excerpt: 'Major hospitals in Monrovia receive modern diagnostic equipment to improve patient care and disease detection.',
      category: 'Liberia News',
      author: 'MedConsult Team',
      date: '2024-11-16',
      source: 'Ministry of Health'
    },
    {
      id: 12,
      title: 'Mental Health Awareness Campaign Launches Nationwide',
      excerpt: 'Liberia\'s first comprehensive mental health awareness campaign aims to reduce stigma and improve access to mental health services.',
      category: 'Liberia News',
      author: 'MedConsult Health Team',
      date: '2024-11-14',
      source: 'Ministry of Health'
    },
  ];

  const posts = [
    {
      id: 1,
      title: '10 Essential Health Tips for Liberians',
      excerpt: 'Discover practical health tips to maintain wellness in Liberia\'s climate and environment.',
      category: 'Health Tips',
      author: 'MedConsult Team',
      date: '2024-11-15',
      image: '/blog/health-tips.jpg'
    },
    {
      id: 2,
      title: 'Understanding Malaria Prevention',
      excerpt: 'Learn about effective malaria prevention strategies and treatment options available in Liberia.',
      category: 'Medical Insights',
      author: 'Isaac B. Zeah, PA',
      date: '2024-11-10',
      image: '/blog/malaria.jpg'
    },
    {
      id: 3,
      title: 'MedConsult Liberia Expands Services',
      excerpt: 'We\'re excited to announce new consultation services and partnerships across Liberia.',
      category: 'Company News',
      author: 'MedConsult Team',
      date: '2024-11-05',
      image: '/blog/expansion.jpg'
    },
  ];

  const researchResources = [
    {
      name: 'World Health Organization (WHO)',
      description: 'Global health data, guidelines, and disease surveillance',
      url: 'https://www.who.int/data',
      category: 'Health Data'
    },
    {
      name: 'World Development Indicators (WDI)',
      description: 'Comprehensive development data including health indicators',
      url: 'https://datatopics.worldbank.org/world-development-indicators/',
      category: 'Development Data'
    },
    {
      name: 'Global Health Observatory (GHO)',
      description: 'WHO\'s portal for health statistics and data',
      url: 'https://www.who.int/data/gho',
      category: 'Health Statistics'
    },
    {
      name: 'Demographic and Health Surveys (DHS)',
      description: 'Population, health, and nutrition data for developing countries',
      url: 'https://dhsprogram.com/',
      category: 'Survey Data'
    },
    {
      name: 'Global Burden of Disease (GBD)',
      description: 'Comprehensive disease burden and risk factor data',
      url: 'https://www.healthdata.org/gbd',
      category: 'Disease Data'
    },
    {
      name: 'UNICEF Data',
      description: 'Child health, nutrition, and development indicators',
      url: 'https://data.unicef.org/',
      category: 'Child Health'
    },
    {
      name: 'Liberia Institute of Statistics (LISGIS)',
      description: 'National statistics and demographic data for Liberia',
      url: 'https://www.lisgis.net/',
      category: 'National Data'
    },
    {
      name: 'PubMed / MEDLINE',
      description: 'Medical research articles and clinical studies',
      url: 'https://pubmed.ncbi.nlm.nih.gov/',
      category: 'Research Articles'
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen size={48} />
              <h1 className="text-4xl md:text-5xl font-bold">Blog & News</h1>
            </div>
            <p className="text-xl text-emerald-100">
              Stay informed with health tips, disease outbreak alerts, medical insights, and company updates
            </p>
          </div>
        </section>

        {/* Dynamic Content with Auto-Updates */}
        <BlogClient 
          outbreakAlerts={outbreakAlerts}
          latestNews={latestNews}
          posts={posts}
          lastUpdated={healthNewsData.lastUpdated}
        />

        {/* Research Resources Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Database size={40} className="text-emerald-600" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Research Resources & Health Indicators</h2>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Access global and national health data sources for research, study, and evidence-based practice
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {researchResources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-xl p-6 hover:shadow-lg hover:border-emerald-300 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-semibold">
                      {resource.category}
                    </span>
                    <ExternalLink size={20} className="text-emerald-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                    {resource.name}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {resource.description}
                  </p>
                  <div className="mt-4 flex items-center text-emerald-600 font-semibold text-sm">
                    <span>Visit Resource</span>
                    <ArrowRight size={16} className="ml-2 group-hover:ml-3 transition-all" />
                  </div>
                </a>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-12 bg-emerald-50 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <TrendingUp size={24} className="text-emerald-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Using These Resources</h3>
                  <p className="text-gray-700 leading-relaxed">
                    These databases provide essential health indicators, statistics, and research data for academic study, 
                    policy development, and evidence-based healthcare practice. They are valuable for researchers, students, 
                    healthcare professionals, and anyone interested in global and national health trends.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
