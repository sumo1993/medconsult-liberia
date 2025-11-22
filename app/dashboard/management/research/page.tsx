'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Download, X, Search, Filter } from 'lucide-react';
import { SkeletonPostList } from '@/components/SkeletonLoader';

interface ResearchPost {
  id: number;
  title: string;
  summary: string | null;
  category: string | null;
  status: string;
  views: number;
  published_at: string | null;
  created_at: string;
  pdf_filename: string | null;
  pdf_size: number | null;
}

export default function ManagementResearchPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<ResearchPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; type: 'publish' | 'delete'; postId: number | null }>({
    show: false,
    type: 'publish',
    postId: null
  });
  const [pdfViewer, setPdfViewer] = useState<{ show: boolean; postId: number | null; filename: string | null; size: number | null }>({
    show: false,
    postId: null,
    filename: null,
    size: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  // Filter and search posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.summary && post.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));

  // Pagination calculations (use filtered posts)
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/research?status=all', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
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

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePublishClick = (postId: number) => {
    setConfirmDialog({ show: true, type: 'publish', postId });
  };

  const handleDeleteClick = (postId: number) => {
    setConfirmDialog({ show: true, type: 'delete', postId });
  };

  const handleConfirm = async () => {
    if (!confirmDialog.postId) return;

    if (confirmDialog.type === 'publish') {
      await handlePublish(confirmDialog.postId);
    } else {
      await handleDelete(confirmDialog.postId);
    }

    setConfirmDialog({ show: false, type: 'publish', postId: null });
  };

  const handlePublish = async (postId: number) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/research/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: 'published' }),
      });

      if (response.ok) {
        showNotification('success', 'Research post published successfully!');
        fetchPosts();
      } else {
        showNotification('error', 'Failed to publish post');
      }
    } catch (error) {
      showNotification('error', 'Network error. Please try again.');
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/research/${postId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        showNotification('success', 'Research post deleted successfully!');
        fetchPosts();
      } else {
        showNotification('error', 'Failed to delete post');
      }
    } catch (error) {
      showNotification('error', 'Network error. Please try again.');
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
                onClick={() => router.push('/dashboard/management')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Research Management</h1>
                <p className="text-sm text-gray-600">Create and manage research articles</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/management/research/create')}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
            >
              <Plus size={20} />
              <span>New Research Post</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search posts by title or summary..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => cat && (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {currentPosts.length} of {filteredPosts.length} posts
            {searchQuery && ` (filtered from ${posts.length} total)`}
          </div>
        </div>

        {loading ? (
          <SkeletonPostList count={6} />
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Research Posts Yet</h2>
            <p className="text-gray-600 mb-6">
              Start creating research articles to share knowledge with your community.
            </p>
            <button
              onClick={() => router.push('/dashboard/management/research/create')}
              className="px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
            >
              Create Your First Research Post
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{post.title}</h3>
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusBadgeColor(post.status)}`}>
                        {post.status}
                      </span>
                    </div>
                    {post.summary && (
                      <p className="text-gray-600 mb-3">{post.summary}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {post.category && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          {post.category}
                        </span>
                      )}
                      <div className="flex items-center">
                        <Eye size={14} className="mr-1" />
                        {post.views} views
                      </div>
                      <span>
                        {post.published_at 
                          ? `Published: ${new Date(post.published_at).toLocaleDateString()}`
                          : `Created: ${new Date(post.created_at).toLocaleDateString()}`
                        }
                      </span>
                      {post.pdf_filename && (
                        <span className="flex items-center text-emerald-600">
                          <FileText size={14} className="mr-1" />
                          PDF attached
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {post.pdf_filename && (
                      <button
                        onClick={() => setPdfViewer({ show: true, postId: post.id, filename: post.pdf_filename, size: post.pdf_size })}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="View PDF"
                      >
                        <FileText size={18} />
                      </button>
                    )}
                    {post.status === 'draft' && (
                      <button
                        onClick={() => handlePublishClick(post.id)}
                        className="px-3 py-2 text-sm bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition-colors"
                        title="Publish"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/management/research/edit/${post.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(post.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      currentPage === pageNum
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
          </>
        )}
      </main>

      {/* Modern Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {confirmDialog.type === 'publish' ? 'Publish Research Post?' : 'Delete Research Post?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmDialog.type === 'publish' 
                ? 'This research post will be visible to the public on the website.'
                : 'This action cannot be undone. The post will be permanently deleted.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDialog({ show: false, type: 'publish', postId: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-white rounded-md transition-colors ${
                  confirmDialog.type === 'publish'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmDialog.type === 'publish' ? 'Publish' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {pdfViewer.show && pdfViewer.postId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <FileText className="text-purple-600" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900">{pdfViewer.filename}</h3>
                  <p className="text-sm text-gray-500">
                    {pdfViewer.size && `${(pdfViewer.size / 1024 / 1024).toFixed(2)} MB`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/research/${pdfViewer.postId}/pdf?download=true`}
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
                >
                  <Download size={16} className="mr-2" />
                  Download
                </a>
                <button
                  onClick={() => setPdfViewer({ show: false, postId: null, filename: null, size: null })}
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
                src={`/api/research/${pdfViewer.postId}/pdf`}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}

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
