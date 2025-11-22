'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, BookOpen, Tag, Download, Eye, X, Clock } from 'lucide-react';
import ShareButtons from '@/components/ShareButtons';
import { calculateReadingTime, formatReadingTime } from '@/utils/readingTime';
import { SkeletonPostDetail } from '@/components/SkeletonLoader';

interface ResearchPost {
  id: number;
  title: string;
  content: string;
  summary: string | null;
  category: string | null;
  tags: string[];
  published_at: string;
  views: number;
  pdf_filename: string | null;
  pdf_size: number | null;
  featured_image: string | null;
  featured_image_filename: string | null;
  featured_image_size: number | null;
}

export default function ResearchPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id;

  const [post, setPost] = useState<ResearchPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/research/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
        // Calculate reading time
        if (data.post.content) {
          setReadingTime(calculateReadingTime(data.post.content));
        }
      } else {
        console.error('Post not found');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.push('/research')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Research
            </button>
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SkeletonPostDetail />
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h2>
          <button
            onClick={() => router.push('/research')}
            className="text-emerald-700 hover:text-emerald-800"
          >
            ← Back to Research
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/research')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Research
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="max-w-4xl mx-auto">
          {/* Post Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 mb-8">
            {/* Category Badge */}
            <div className="text-center mb-6">
              {post.category && (
                <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-full">
                  {post.category}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center leading-tight">
              {post.title}
            </h1>

            {/* Featured Image */}
            {post.featured_image && (
              <div className="mb-8 rounded-lg overflow-hidden shadow-md">
                <img 
                  src={`data:image/jpeg;base64,${post.featured_image}`}
                  alt={post.title}
                  className="w-full h-auto object-cover max-h-[500px]"
                />
              </div>
            )}

            {/* Summary */}
            {post.summary && (
              <p className="text-xl text-gray-600 mb-8 text-justify max-w-3xl mx-auto leading-relaxed">
                {post.summary}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 border-t border-gray-200 pt-6 mb-6">
              <div className="flex items-center">
                <Calendar size={16} className="mr-2 text-emerald-600" />
                <span className="font-medium">Published:</span>
                <span className="ml-1">{new Date(post.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center">
                <BookOpen size={16} className="mr-2 text-emerald-600" />
                <span className="font-medium">{post.views} views</span>
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-2 text-emerald-600" />
                <span className="font-medium">{formatReadingTime(readingTime)}</span>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex justify-center border-t border-gray-200 pt-6">
              <ShareButtons
                url={typeof window !== 'undefined' ? window.location.href : ''}
                title={post.title}
                description={post.summary || undefined}
              />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-200 pt-6">
                <Tag size={16} className="text-gray-400" />
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-700 leading-relaxed text-justify" 
                style={{ textAlign: 'justify', textJustify: 'inter-word' }}
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </div>

          {/* PDF Download Section */}
          {post.pdf_filename && (
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg shadow-md p-6 mt-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-emerald-500 p-3 rounded-lg">
                    <Download className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Research Document Available
                    </h3>
                    <p className="text-sm text-gray-600">
                      {post.pdf_filename} 
                      {post.pdf_size && ` • ${(post.pdf_size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPdfViewer(true)}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Eye size={20} className="mr-2" />
                    View PDF
                  </button>
                  <a
                    href={`/api/research/${post.id}/pdf?download=true`}
                    className="inline-flex items-center px-6 py-3 bg-emerald-700 text-white font-semibold rounded-md hover:bg-emerald-800 transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Download size={20} className="mr-2" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/research')}
              className="inline-flex items-center px-6 py-3 bg-emerald-700 text-white font-semibold rounded-md hover:bg-emerald-800 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to All Research
            </button>
          </div>
        </article>
      </main>

      {/* PDF Viewer Modal */}
      {showPdfViewer && post?.pdf_filename && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <Eye className="text-blue-600" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900">{post.pdf_filename}</h3>
                  <p className="text-sm text-gray-500">
                    {post.pdf_size && `${(post.pdf_size / 1024 / 1024).toFixed(2)} MB`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/research/${post.id}/pdf?download=true`}
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
                >
                  <Download size={16} className="mr-2" />
                  Download
                </a>
                <button
                  onClick={() => setShowPdfViewer(false)}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                  title="Close"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`/api/research/${post.id}/pdf`}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
