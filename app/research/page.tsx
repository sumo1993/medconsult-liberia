'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Calendar, ArrowLeft, Search } from 'lucide-react';

interface ResearchPost {
  id: number;
  title: string;
  summary: string | null;
  category: string | null;
  published_at: string;
  views: number;
}

export default function ResearchPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<ResearchPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<ResearchPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [searchTerm, selectedCategory, posts]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/research?status=published');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching research posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.summary && post.summary.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredPosts(filtered);
  };

  const categories = ['all', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean))) as string[]];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-white hover:text-emerald-100 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </button>
          <h1 className="text-4xl font-bold mb-4">Research & Publications</h1>
          <p className="text-emerald-100 text-lg max-w-2xl">
            Explore our research findings, health indicators, and contributions to medical knowledge
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search research..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                {categories.map(category => (
                  <option key={category} value={category || ''}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading research posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Research Posts Found</h2>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Check back soon for new research publications'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                onClick={() => router.push(`/research/${post.id}`)}
              >
                <div className="p-6">
                  {/* Category Badge */}
                  {post.category && (
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full mb-3">
                      {post.category}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Summary */}
                  {post.summary && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.summary}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {new Date(post.published_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <BookOpen size={14} className="mr-1" />
                      {post.views} views
                    </div>
                  </div>
                </div>

                {/* Read More Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <span className="text-emerald-700 font-semibold hover:text-emerald-800">
                    Read Full Article →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
