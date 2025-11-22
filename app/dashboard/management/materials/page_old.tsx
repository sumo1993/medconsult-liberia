'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Download, FileText, Folder } from 'lucide-react';

export default function ManagementMaterialsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/management')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Study Materials</h1>
                <p className="text-sm text-gray-600">Upload and manage learning resources</p>
              </div>
            </div>
            <button
              onClick={() => alert('Upload functionality coming soon!')}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
            >
              <Upload size={20} />
              <span>Upload Material</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Materials</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Downloads</p>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Categories</p>
            <p className="text-3xl font-bold text-purple-600">0</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Study Materials Yet</h2>
          <p className="text-gray-600 mb-6">
            Upload study materials, documents, and resources for your clients to access.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <Folder className="text-blue-600 mb-3" size={32} />
              <h3 className="font-semibold text-blue-900 mb-2">Organize by Category</h3>
              <p className="text-sm text-blue-800">
                Group materials by subject, topic, or course for easy navigation
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <Download className="text-green-600 mb-3" size={32} />
              <h3 className="font-semibold text-green-900 mb-2">Track Downloads</h3>
              <p className="text-sm text-green-800">
                Monitor which materials are most popular and useful
              </p>
            </div>
          </div>

          <button
            onClick={() => alert('Upload functionality coming soon!')}
            className="px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
          >
            Upload Your First Material
          </button>

          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-3">Supported File Types:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="mr-2">📄</span>
                <span>PDF</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📝</span>
                <span>Word (DOC/DOCX)</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📊</span>
                <span>PowerPoint (PPT)</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📑</span>
                <span>Excel (XLS)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
