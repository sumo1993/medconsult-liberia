'use client';

import { useRouter } from 'next/navigation';
import { Calendar, User, ArrowRight, AlertTriangle, Shield, Globe, Newspaper, Heart, BookOpen, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface OutbreakAlert {
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

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  source: string;
}

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  image: string;
}

interface BlogClientProps {
  outbreakAlerts: OutbreakAlert[];
  latestNews: NewsItem[];
  posts: BlogPost[];
  lastUpdated: string;
}

export default function BlogClient({ outbreakAlerts, latestNews, posts, lastUpdated }: BlogClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <>
      {/* Last Updated Banner */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} />
              <span>Last updated: {getTimeAgo(lastUpdated)}</span>
              <span className="text-gray-400">•</span>
              <span className="text-xs text-gray-500">Auto-updates every hour</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Health Alerts & Outbreak Section */}
      {outbreakAlerts.length > 0 && (
        <section className="py-16 bg-red-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle size={32} className="text-red-600" />
              <h2 className="text-3xl font-bold text-gray-900">Health Alerts & Disease Outbreaks</h2>
            </div>
            <p className="text-gray-700 mb-8 max-w-3xl">
              Critical updates on disease outbreaks, health emergencies, and prevention guidelines. Stay informed to protect yourself and your community.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outbreakAlerts.map((alert) => (
                <article 
                  key={alert.id} 
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className={`h-48 flex items-center justify-center ${
                    alert.severity === 'high' ? 'bg-gradient-to-br from-red-500 to-red-600' : 
                    alert.severity === 'medium' ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 
                    'bg-gradient-to-br from-yellow-500 to-yellow-600'
                  }`}>
                    <Shield className="text-white" size={64} />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        alert.severity === 'high' ? 'bg-red-100 text-red-800' : 
                        alert.severity === 'medium' ? 'bg-orange-100 text-orange-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.category}
                      </span>
                      {alert.isActive && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{alert.title}</h3>
                    <p className="text-gray-600 mb-4">{alert.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <User size={16} />
                        {alert.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {formatDate(alert.date)}
                      </span>
                    </div>
                    <button 
                      onClick={() => router.push(`/blog/${alert.id}`)}
                      className={`font-semibold flex items-center gap-2 hover:gap-3 transition-all ${
                        alert.severity === 'high' ? 'text-red-600' : 
                        alert.severity === 'medium' ? 'text-orange-600' : 'text-yellow-700'
                      }`}
                    >
                      Read More <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Emergency Contact Banner */}
            <div className="mt-8 bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
              <div className="flex items-start gap-4">
                <AlertTriangle size={32} className="flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold mb-2">Health Emergency?</h3>
                  <p className="text-red-100 mb-4">
                    If you suspect you have symptoms of any disease outbreak or need immediate medical advice, 
                    consult with our healthcare professionals immediately.
                  </p>
                  <button
                    onClick={() => router.push('/book-consultation')}
                    className="bg-white text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                  >
                    Get Immediate Consultation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest News - Liberia & World */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Globe size={32} className="text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">Latest Health News - Liberia & World</h2>
          </div>
          <p className="text-gray-700 mb-8 max-w-3xl">
            Stay updated with the latest health developments in Liberia and important global health news that affects our community.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestNews.map((news) => (
              <article 
                key={news.id} 
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className={`h-48 flex items-center justify-center ${
                  news.category === 'Liberia News' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                }`}>
                  {news.category === 'Liberia News' ? (
                    <Newspaper className="text-white" size={64} />
                  ) : (
                    <Globe className="text-white" size={64} />
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      news.category === 'Liberia News' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {news.category}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{news.source}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{news.title}</h3>
                  <p className="text-gray-600 mb-4">{news.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <User size={16} />
                      {news.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      {formatDate(news.date)}
                    </span>
                  </div>
                  <button 
                    onClick={() => router.push(`/blog/${news.id}`)}
                    className={`font-semibold flex items-center gap-2 hover:gap-3 transition-all ${
                      news.category === 'Liberia News' ? 'text-blue-600' : 'text-indigo-600'
                    }`}
                  >
                    Read More <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Health Tips & Medical Insights */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Heart size={32} className="text-emerald-600" />
            <h2 className="text-3xl font-bold text-gray-900">Health Tips & Medical Insights</h2>
          </div>
          <p className="text-gray-700 mb-8 max-w-3xl">
            Expert advice and practical tips to help you maintain good health and wellness.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
                  <BookOpen className="text-white" size={64} />
                </div>
                <div className="p-6">
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold mb-3">
                    {post.category}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h2>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <User size={16} />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      {formatDate(post.date)}
                    </span>
                  </div>
                  <button 
                    onClick={() => router.push(`/blog/${post.id}`)}
                    className="text-emerald-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    Read More <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
