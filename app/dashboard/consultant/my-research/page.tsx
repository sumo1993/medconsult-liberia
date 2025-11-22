'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Eye, Edit, Trash2, Clock, CheckCircle, XCircle, Upload } from 'lucide-react';
import Toast from '@/components/Toast';

interface ResearchPaper {
  id: number;
  title: string;
  summary: string;
  category: string;
  status: string;
  views: number;
  likes: number;
  created_at: string;
  rejection_reason: string | null;
}

export default function MyResearchPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ResearchPaper | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmitId, setPendingSubmitId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchMyPapers();
  }, []);

  const fetchMyPapers = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/consultant/my-research', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPapers(data);
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('auth-token');
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('summary', formData.summary);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('category', formData.category);
      if (pdfFile) {
        formDataToSend.append('pdf', pdfFile);
      }
      if (editingPaper) {
        formDataToSend.append('id', editingPaper.id.toString());
      }

      const response = await fetch('/api/consultant/my-research', {
        method: editingPaper ? 'PUT' : 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formDataToSend
      });

      if (response.ok) {
        setToast({ 
          message: editingPaper ? 'Research paper updated successfully!' : 'Research paper created successfully!', 
          type: 'success' 
        });
        setShowModal(false);
        resetForm();
        fetchMyPapers();
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Failed to save paper', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving paper:', error);
      setToast({ message: 'Failed to save paper', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async (paperId: number) => {
    setPendingSubmitId(paperId);
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    if (!pendingSubmitId) return;
    
    const paperId = pendingSubmitId;
    setShowConfirmModal(false);
    setPendingSubmitId(null);
    setErrorMessage(null);
    
    try {
      const token = localStorage.getItem('auth-token');
      
      setErrorMessage('Submitting paper ID: ' + paperId + '...');
      
      const response = await fetch(`/api/consultant/my-research/${paperId}/submit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      setErrorMessage('Response status: ' + response.status);

      if (response.ok) {
        const result = await response.json();
        setToast({ message: 'Paper submitted for review successfully!', type: 'success' });
        setErrorMessage(null);
        fetchMyPapers();
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Failed to submit paper', type: 'error' });
        setErrorMessage(null);
      }
    } catch (error: any) {
      setToast({ message: 'Failed to submit paper', type: 'error' });
      setErrorMessage(null);
    }
  };

  const handleDelete = async (paperId: number) => {
    setPendingDeleteId(paperId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    
    const paperId = pendingDeleteId;
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/consultant/my-research/${paperId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        setToast({ message: 'Paper deleted successfully', type: 'success' });
        fetchMyPapers();
      } else {
        setToast({ message: 'Failed to delete paper', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting paper:', error);
      setToast({ message: 'Failed to delete paper', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({ title: '', summary: '', content: '', category: '' });
    setPdfFile(null);
    setEditingPaper(null);
  };

  const openEditModal = (paper: ResearchPaper) => {
    setEditingPaper(paper);
    setFormData({
      title: paper.title,
      summary: paper.summary,
      content: '',
      category: paper.category,
    });
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Draft</span>;
      case 'pending':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending Review</span>;
      case 'published':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Published</span>;
      case 'archived':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Archived</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your research...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Error/Status Message */}
        {errorMessage && (
          <div className={`mb-6 p-4 rounded-lg text-white font-semibold text-center ${
            errorMessage.includes('SUCCESS') ? 'bg-green-600' : 
            errorMessage.includes('ERROR') || errorMessage.includes('EXCEPTION') ? 'bg-red-600' : 
            'bg-blue-600'
          }`}>
            {errorMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Research Papers</h1>
            <p className="text-gray-600">Create and manage your research publications</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center gap-2"
          >
            <Plus size={20} />
            New Research Paper
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{papers.length}</div>
            <div className="text-sm text-gray-600">Total Papers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{papers.filter(p => p.status === 'published').length}</div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">{papers.filter(p => p.status === 'pending').length}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-600">{papers.filter(p => p.status === 'draft').length}</div>
            <div className="text-sm text-gray-600">Drafts</div>
          </div>
        </div>

        {/* Papers List */}
        {papers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Research Papers Yet</h3>
            <p className="text-gray-600 mb-6">Start by creating your first research paper</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create First Paper
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {papers.map((paper) => (
              <div key={paper.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{paper.title}</h3>
                      {getStatusBadge(paper.status)}
                    </div>
                    <p className="text-gray-600 mb-3">{paper.summary}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye size={16} />
                        {paper.views} views
                      </span>
                      <span>❤️ {paper.likes} likes</span>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">
                        {paper.category}
                      </span>
                      <span>{new Date(paper.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Rejection Reason */}
                {paper.rejection_reason && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-900 mb-1">Rejected - Needs Revision</div>
                        <div className="text-sm text-red-700">{paper.rejection_reason}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {paper.status === 'draft' && (
                    <>
                      <button
                        onClick={() => openEditModal(paper)}
                        className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-semibold flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleSubmitForReview(paper.id)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center gap-2"
                      >
                        <Upload size={16} />
                        Submit for Review
                      </button>
                      <button
                        onClick={() => handleDelete(paper.id)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </>
                  )}
                  {paper.status === 'pending' && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Clock size={16} />
                      <span className="text-sm font-semibold">Awaiting admin review...</span>
                    </div>
                  )}
                  {paper.status === 'published' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle size={16} />
                      <span className="text-sm font-semibold">Published and visible to public</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
                <h2 className="text-2xl font-bold">
                  {editingPaper ? 'Edit Research Paper' : 'Create New Research Paper'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter research paper title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., Public Health, Maternal Health"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Summary *</label>
                  <textarea
                    required
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Brief summary of your research (2-3 sentences)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Content *</label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter the full research paper content..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PDF File (Optional)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload a PDF version of your research paper</p>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingPaper ? 'Update Paper' : 'Create Paper'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
                  <Upload className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Submit for Review?</h3>
                <p className="text-gray-600 mb-6">
                  Your research paper will be sent to the admin for review. You won't be able to edit it until it's reviewed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setPendingSubmitId(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSubmit}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Yes, Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Delete Paper?</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this research paper? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setPendingDeleteId(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Trash2 size={20} />
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
