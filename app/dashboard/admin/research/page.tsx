'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Plus } from 'lucide-react';

export default function ResearchPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Research Management</h1>
                <p className="text-sm text-gray-600">Manage all research posts</p>
              </div>
            </div>
            <button
              onClick={() => alert('Create research post coming soon!')}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
            >
              <Plus size={20} />
              <span>New Research</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Research Posts Yet</h2>
          <p className="text-gray-600 mb-6">
            Start creating research articles to share knowledge with your community.
          </p>
          <button
            onClick={() => alert('Create research post coming soon!')}
            className="px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
          >
            Create Your First Research Post
          </button>
        </div>
      </main>
    </div>
  );
}
