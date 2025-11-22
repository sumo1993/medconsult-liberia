'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Eye, Clock, FileText, User, Download, ArrowLeft } from 'lucide-react';

interface ResearchPaper {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  author_id: number;
  author_name: string;
  status: string;
  created_at: string;
  pdf_filename: string | null;
}

export default function ResearchApprovalsPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingPapers();
  }, []);

  const fetchPendingPapers = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/research-approvals', {
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

  const handleApprove = async (paperId: number) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/research-approvals/${paperId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'approve' })
      });

      if (response.ok) {
        alert('Research paper approved and published!');
        setShowModal(false);
        fetchPendingPapers();
      }
    } catch (error) {
      console.error('Error approving paper:', error);
      alert('Failed to approve paper');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (paperId: number) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/research-approvals/${paperId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          action: 'reject',
          rejection_reason: rejectionReason 
        })
      });

      if (response.ok) {
        alert('Research paper rejected. Researcher will be notified.');
        setShowModal(false);
        setRejectionReason('');
        fetchPendingPapers();
      }
    } catch (error) {
      console.error('Error rejecting paper:', error);
      alert('Failed to reject paper');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending research...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/dashboard/management')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Paper Approvals</h1>
          <p className="text-gray-600">Review and approve research papers before publication</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{papers.length}</div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </div>
            </div>
          </div>
        </div>

        {/* Papers List */}
        {papers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Papers</h3>
            <p className="text-gray-600">All research papers have been reviewed</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {papers.map((paper) => (
                    <tr key={paper.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{paper.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{paper.summary}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-900">{paper.author_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          {paper.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(paper.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedPaper(paper);
                            setShowModal(true);
                          }}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                        >
                          <Eye size={16} />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showModal && selectedPaper && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
                <h2 className="text-2xl font-bold mb-2">{selectedPaper.title}</h2>
                <div className="flex items-center gap-4 text-sm text-emerald-100">
                  <span className="flex items-center gap-1">
                    <User size={16} />
                    {selectedPaper.author_name}
                  </span>
                  <span>{selectedPaper.category}</span>
                  <span>{new Date(selectedPaper.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                  <p className="text-gray-700">{selectedPaper.summary}</p>
                </div>

                {/* PDF Viewer */}
                {selectedPaper.pdf_filename && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <FileText size={20} className="text-emerald-600" />
                      Attached PDF Document
                    </h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <iframe
                        src={`/api/research-pdf/${selectedPaper.id}`}
                        className="w-full h-[600px]"
                        title="Research PDF"
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <a
                        href={`/api/research-pdf/${selectedPaper.id}`}
                        download={selectedPaper.pdf_filename}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <Download size={16} />
                        Download PDF
                      </a>
                      <a
                        href={`/api/research-pdf/${selectedPaper.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <Eye size={16} />
                        Open in New Tab
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Full Content</h3>
                  <div className="text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {selectedPaper.content}
                  </div>
                </div>

                {/* Rejection Reason Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Provide feedback for the researcher..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedPaper.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle size={20} />
                    {processing ? 'Processing...' : 'Approve & Publish'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedPaper.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={20} />
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setRejectionReason('');
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
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
