'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Calendar, User, ArrowRight } from 'lucide-react';

interface ResearchPost {
  id: number;
  title: string;
  summary: string | null;
  category: string | null;
  published_at: string;
  views: number;
}

export default function ResearchSection() {
  const router = useRouter();
  const [posts, setPosts] = useState<ResearchPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/research?status=published');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts.slice(0, 3)); // Show only 3 latest
      }
    } catch (error) {
      console.error('Error fetching research posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="research" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">Loading research...</p>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null; // Don't show section if no published posts
  }

  return (
    <section id="research" className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
            Research & Publications
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Explore our latest research findings, health indicators, and contributions to medical knowledge
          </p>
        </div>

        {/* Research Posts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 flex flex-col h-full"
              onClick={() => router.push(`/research/${post.id}`)}
            >
              <div className="p-4 sm:p-5 md:p-6 flex flex-col flex-grow">
                {/* Category Badge */}
                {post.category && (
                  <span className="inline-block px-2 sm:px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full mb-2 sm:mb-3 w-fit">
                    {post.category}
                  </span>
                )}

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 min-h-[3.5rem]">
                  {post.title}
                </h3>

                {/* Summary */}
                {post.summary && (
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-3 flex-grow">
                    {post.summary}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 gap-2">
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{new Date(post.published_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <BookOpen size={14} className="mr-1 flex-shrink-0" />
                    <span>{post.views} views</span>
                  </div>
                </div>

                {/* Read More Link */}
                <button className="flex items-center text-emerald-700 font-semibold hover:text-emerald-800 transition-colors text-sm sm:text-base mt-auto">
                  Read More
                  <ArrowRight size={16} className="ml-2 flex-shrink-0" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center px-4">
          <button
            onClick={() => router.push('/research')}
            className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-emerald-700 text-white font-semibold rounded-md hover:bg-emerald-800 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
          >
            View All Research
            <ArrowRight size={18} className="ml-2 flex-shrink-0" />
          </button>
        </div>
      </div>
    </section>
  );
}
