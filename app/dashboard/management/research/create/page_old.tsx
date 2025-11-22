'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, CheckCircle, XCircle } from 'lucide-react';

export default function CreateResearchPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
    tags: '',
    status: 'draft',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent, publishNow = false) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: publishNow ? 'published' : formData.status,
        }),
      });

      if (response.ok) {
        showNotification('success', publishNow ? 'Research published successfully!' : 'Draft saved successfully!');
        setTimeout(() => router.push('/dashboard/management/research'), 1500);
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to save research post');
      }
    } catch (error) {
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/management/research')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Research Post</h1>
                <p className="text-sm text-gray-600">Share your medical research and insights</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={(e) => handleSubmit(e, false)} className="bg-white rounded-lg shadow p-8">
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter research title..."
            />
          </div>

          {/* Summary */}
          <div className="mb-6">
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
              Summary
            </label>
            <textarea
              id="summary"
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Brief summary of the research..."
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              id="content"
              rows={15}
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
              placeholder="Write your research content here..."
            />
            <p className="mt-1 text-sm text-gray-500">
              You can use plain text or markdown formatting
            </p>
          </div>

          {/* Category and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Select category...</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Public Health">Public Health</option>
                <option value="Clinical Research">Clinical Research</option>
                <option value="Infectious Diseases">Infectious Diseases</option>
                <option value="Chronic Diseases">Chronic Diseases</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="malaria, treatment, prevention"
              />
              <p className="mt-1 text-sm text-gray-500">Comma-separated tags</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/dashboard/management/research')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                <span>{isSubmitting ? 'Saving...' : 'Save Draft'}</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition-colors disabled:opacity-50"
              >
                <Eye size={18} />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Now'}</span>
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Modern Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-2xl border-l-4 ${
              notification.type === 'success'
                ? 'bg-white border-emerald-500'
                : 'bg-white border-red-500'
            } transform transition-all duration-300 ease-in-out`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="text-emerald-500 flex-shrink-0" size={24} />
            ) : (
              <XCircle className="text-red-500 flex-shrink-0" size={24} />
            )}
            <div className="flex-1">
              <p className="text-gray-900 font-semibold">{notification.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
