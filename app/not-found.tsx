'use client';

import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-emerald-600 mb-4">404</h1>
          <div className="flex justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-emerald-200 rounded-full animate-bounce"></div>
            <div className="w-16 h-16 bg-teal-200 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-16 h-16 bg-emerald-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-all"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-all shadow-md"
          >
            <Home size={20} />
            Go Home
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">You might be looking for:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => router.push('/about')}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-emerald-50 text-sm font-medium shadow-sm"
            >
              About Us
            </button>
            <button
              onClick={() => router.push('/research')}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-emerald-50 text-sm font-medium shadow-sm"
            >
              Research
            </button>
            <button
              onClick={() => router.push('/blog')}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-emerald-50 text-sm font-medium shadow-sm"
            >
              Blog
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-emerald-50 text-sm font-medium shadow-sm"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
