'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function AssignmentsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/admin')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assignment Requests</h1>
              <p className="text-sm text-gray-600">Manage all client assignment requests</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Assignment Requests Yet</h2>
          <p className="text-gray-600">
            Assignment requests from clients will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
