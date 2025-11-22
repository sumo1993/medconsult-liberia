'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Eye, CheckCircle, XCircle } from 'lucide-react';

export default function EditResearchPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id;

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
    tags: '',
    status: 'draft',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      console.log('Fetching post ID:', postId);
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/research/${postId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Post data:', data);
        
        setFormData({
          title: data.post.title || '',
          summary: data.post.summary || '',
          content: data.post.content || '',
          category: data.post.category || '',
          tags: Array.isArray(data.post.tags) ? data.post.tags.join(', ') : '',
          status: data.post.status || 'draft',
        });
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        showNotification('error', `Failed to load post: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      showNotification('error', `Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent, publishNow = false) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/research/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...formData,
          status: publishNow ? 'published' : formData.status,
        }),
      });

      if (response.ok) {
        showNotification('success', publishNow ? 'Research published successfully!' : 'Changes saved successfully!');
        setTimeout(() => router.push('/dashboard/management/research'), 1500);
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to update research post');
      }
    } catch (error) {
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading post...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/management/research')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Research Post</h1>
              <p className="text-sm text-gray-600">Update your research article</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter research title"
            />
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Brief summary of your research"
            />
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={15}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
              placeholder="Write your research content here..."
            />
          </div>

          {/* Category and Tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select category</option>
                  <option value="Clinical Research">Clinical Research</option>
                  <option value="Public Health">Public Health</option>
                  <option value="Medical Education">Medical Education</option>
                  <option value="Case Studies">Case Studies</option>
                  <option value="Health Policy">Health Policy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Comma separated tags"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition-colors disabled:opacity-50"
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
