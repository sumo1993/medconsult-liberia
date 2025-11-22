'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Clock, User, CheckCircle, XCircle, MessageSquare, Eye, FileText } from 'lucide-react';

interface Assignment {
  id: number;
  client_id: number;
  client_name: string;
  client_email: string;
  title: string;
  description: string;
  subject: string;
  deadline: string | null;
  priority: string;
  status: string;
  feedback: string | null;
  created_at: string;
}

export default function ManagementAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/management/assignments', { headers });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (id: number, status: string, feedbackText?: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/management/assignments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status, feedback: feedbackText }),
      });

      if (response.ok) {
        fetchAssignments();
        setShowFeedbackModal(false);
        setFeedback('');
        setNotification({ type: 'success', message: `Assignment ${status} successfully!` });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      setNotification({ type: 'error', message: 'Failed to update assignment' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleProvideFeedback = async () => {
    if (!selectedAssignment || !feedback.trim()) {
      setNotification({ type: 'error', message: 'Please enter feedback' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setIsSubmitting(true);
    await updateAssignmentStatus(selectedAssignment.id, 'completed', feedback);
    setIsSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Review' };
      case 'in_progress':
        return { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'In Progress' };
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock, label: status };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredAssignments = filter === 'all' 
    ? assignments 
    : assignments.filter(a => a.status === filter);

  const stats = {
    pending: assignments.filter(a => a.status === 'pending').length,
    in_progress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/management')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assignment Requests</h1>
              <p className="text-sm text-gray-600">Review and manage client assignment requests</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">In Progress</p>
            <p className="text-3xl font-bold text-blue-600">{stats.in_progress}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Requests</p>
            <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex space-x-2">
            {['all', 'pending', 'in_progress', 'completed', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md capitalize transition-colors ${
                  filter === status
                    ? 'bg-emerald-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Assignments List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Loading assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No Assignment Requests Yet' : `No ${filter.replace('_', ' ')} assignments`}
            </h2>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'When clients submit assignment requests, they will appear here for your review.'
                : 'Try selecting a different filter.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const statusInfo = getStatusBadge(assignment.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div key={assignment.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{assignment.title}</h3>
                        <span className={`px-3 py-1 text-xs rounded-full ${statusInfo.color} flex items-center space-x-1`}>
                          <StatusIcon size={14} />
                          <span>{statusInfo.label}</span>
                        </span>
                        <span className={`px-3 py-1 text-xs rounded-full border ${getPriorityBadge(assignment.priority)}`}>
                          {assignment.priority} priority
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User size={14} className="mr-1" />
                          {assignment.client_name}
                        </div>
                        <span>{assignment.client_email}</span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          {assignment.subject}
                        </span>
                        {assignment.deadline && (
                          <span>Deadline: {new Date(assignment.deadline).toLocaleDateString()}</span>
                        )}
                      </div>

                      <p className="text-gray-700 mb-3">{assignment.description}</p>

                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(assignment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Feedback Section */}
                  {assignment.feedback && (
                    <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <h4 className="font-semibold text-emerald-900 mb-2">Your Feedback:</h4>
                      <p className="text-sm text-emerald-800">{assignment.feedback}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3 mt-4 pt-4 border-t">
                    <button
                      onClick={() => router.push(`/dashboard/assignments/${assignment.id}/files`)}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      <FileText size={16} />
                      <span>View Files & Upload</span>
                    </button>
                    
                    {assignment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateAssignmentStatus(assignment.id, 'in_progress')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Start Review
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowFeedbackModal(true);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          <MessageSquare size={16} />
                          <span>Provide Feedback</span>
                        </button>
                        <button
                          onClick={() => updateAssignmentStatus(assignment.id, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>

                  {assignment.status === 'in_progress' && (
                    <div className="flex space-x-3 mt-4 pt-4 border-t">
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowFeedbackModal(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <CheckCircle size={16} />
                        <span>Complete & Provide Feedback</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Provide Feedback</h2>
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedback('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedAssignment.title}</h3>
                  <p className="text-sm text-gray-600">By: {selectedAssignment.client_name}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback *
                  </label>
                  <textarea
                    rows={8}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Provide detailed feedback, suggestions, and guidance..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowFeedbackModal(false);
                      setFeedback('');
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProvideFeedback}
                    disabled={isSubmitting || !feedback.trim()}
                    className="px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div
              className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg border-l-4 ${
                notification.type === 'success'
                  ? 'bg-white border-green-500'
                  : 'bg-white border-red-500'
              }`}
              style={{
                minWidth: '320px',
                maxWidth: '500px',
                animation: 'slideIn 0.3s ease-out',
              }}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <XCircle className="text-red-600" size={20} />
                )}
              </div>
              <div className="flex-1">
                <h4
                  className={`font-semibold ${
                    notification.type === 'success' ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {notification.type === 'success' ? 'Success!' : 'Error'}
                </h4>
                <p
                  className={`text-sm ${
                    notification.type === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
