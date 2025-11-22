'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Eye, Calendar, Search } from 'lucide-react';

interface ResearchPost {
  id: number;
  title: string;
  summary: string | null;
  content: string;
  category: string | null;
  views: number;
  published_at: string;
  author_name: string;
}

export default function ClientResearchPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<ResearchPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<ResearchPost | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/research?status=published');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching research:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.summary && post.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (post.category && post.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/client')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Research Library</h1>
              <p className="text-sm text-gray-600">Access medical research and articles</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search research articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Loading research articles...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No Results Found' : 'No Research Available'}
            </h2>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try different search terms'
                : 'Research articles will appear here when published by the doctor'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Research List */}
            <div className="lg:col-span-1 space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                    selectedPost?.id === post.id ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                  {post.category && (
                    <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                      {post.category}
                    </span>
                  )}
                  <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Eye size={12} className="mr-1" />
                      {post.views}
                    </div>
                    <div className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {new Date(post.published_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Research Detail */}
            <div className="lg:col-span-2">
              {selectedPost ? (
                <div className="bg-white rounded-lg shadow p-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedPost.title}</h1>
                  
                  <div className="flex items-center space-x-4 mb-6 text-sm text-gray-600">
                    {selectedPost.category && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded">
                        {selectedPost.category}
                      </span>
                    )}
                    <span>By {selectedPost.author_name}</span>
                    <span>{new Date(selectedPost.published_at).toLocaleDateString()}</span>
                    <div className="flex items-center">
                      <Eye size={14} className="mr-1" />
                      {selectedPost.views} views
                    </div>
                  </div>

                  {selectedPost.summary && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-emerald-900 mb-2">Summary</h3>
                      <p className="text-emerald-800">{selectedPost.summary}</p>
                    </div>
                  )}

                  <div className="prose max-w-none">
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedPost.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">Select a research article to read</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
