'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, Eye, DollarSign, Calendar, Briefcase, Send, XCircle, Users, Lock, X, BookOpen } from 'lucide-react';

interface Assignment {
  id: number;
  title: string;
  subject: string;
  description: string;
  status: string;
  deadline: string | null;
  final_price: number | null;
  proposed_price: number | null;
  currency: string;
  client_name: string;
  created_at: string;
  assigned_at: string | null;
  consultant_id: number | null;
  assigned_consultant_name: string | null;
  has_applied: number;
  application_status: string | null;
}

export default function ConsultantAssignmentsPage() {
  const router = useRouter();
  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'available' | 'library'>('my');
  const [filter, setFilter] = useState('all');
  const [applyingTo, setApplyingTo] = useState<number | null>(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // View Details Modal
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchAllAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/consultant/assignments', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setMyAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAssignments = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/assignments/available', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setAllAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching all assignments:', error);
    }
  };

  const handleApply = async (assignmentId: number) => {
    try {
      const token = localStorage.getItem('auth-token');
      console.log('Applying for assignment:', assignmentId);
      
      const response = await fetch(`/api/assignments/${assignmentId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: applicationMessage }),
        credentials: 'include',
      });

      console.log('Apply response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('Apply response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        showNotificationMsg('error', 'Server error - please try again');
        return;
      }
      
      if (response.ok || data.success) {
        showNotificationMsg('success', data.message || 'Interest submitted successfully!');
        setApplyingTo(null);
        setApplicationMessage('');
        fetchAllAssignments();
      } else {
        // Show the specific error from the API
        const errorMessage = data.error || data.message || 'Failed to submit';
        console.log('Apply error:', errorMessage);
        showNotificationMsg('error', errorMessage);
        // Refresh the list in case the status changed
        fetchAllAssignments();
      }
    } catch (error: any) {
      console.error('Apply network error:', error);
      showNotificationMsg('error', 'Network error: ' + (error.message || 'Please try again'));
    }
  };

  const handleWithdrawApplication = async (assignmentId: number) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/assignments/${assignmentId}/apply`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        showNotificationMsg('success', 'Application withdrawn');
        fetchAllAssignments();
      }
    } catch (error) {
      showNotificationMsg('error', 'Failed to withdraw application');
    }
  };

  const showNotificationMsg = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const openDetailsModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending_review': 'bg-yellow-100 text-yellow-800',
      'price_proposed': 'bg-purple-100 text-purple-800',
      'negotiating': 'bg-orange-100 text-orange-800',
      'payment_pending': 'bg-indigo-100 text-indigo-800',
      'payment_uploaded': 'bg-teal-100 text-teal-800',
      'payment_verified': 'bg-emerald-100 text-emerald-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-cyan-100 text-cyan-800',
      'work_submitted': 'bg-violet-100 text-violet-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending_review': '⏳ Pending Review',
      'price_proposed': '💰 Price Proposed',
      'negotiating': '🤝 Negotiating',
      'payment_pending': '💳 Awaiting Payment',
      'payment_uploaded': '📄 Payment Uploaded',
      'payment_verified': '✅ Ready for Work',
      'assigned': '👤 Assigned',
      'in_progress': '🔄 In Progress',
      'work_submitted': '📤 Work Submitted',
      'completed': '✓ Completed',
      'cancelled': '❌ Cancelled',
    };
    return labels[status] || status;
  };

  const getWorkflowStage = (status: string) => {
    if (['pending_review', 'price_proposed', 'negotiating'].includes(status)) {
      return { stage: 'pricing', label: 'Pricing Stage', color: 'text-purple-600 bg-purple-50' };
    }
    if (['payment_pending', 'payment_uploaded'].includes(status)) {
      return { stage: 'payment', label: 'Payment Stage', color: 'text-orange-600 bg-orange-50' };
    }
    if (['payment_verified'].includes(status)) {
      return { stage: 'ready', label: 'Ready for Assignment', color: 'text-emerald-600 bg-emerald-50' };
    }
    if (['assigned', 'in_progress', 'work_submitted'].includes(status)) {
      return { stage: 'working', label: 'Work in Progress', color: 'text-blue-600 bg-blue-50' };
    }
    if (status === 'completed') {
      return { stage: 'done', label: 'Completed', color: 'text-green-600 bg-green-50' };
    }
    return { stage: 'unknown', label: 'Unknown', color: 'text-gray-600 bg-gray-50' };
  };

  // Filter assignments for "Available" tab - exclude others' in-progress work
  const availableAssignments = allAssignments.filter(a => {
    const isAssignedToMe = myAssignments.some(m => m.id === a.id);
    const isAssignedToOther = a.consultant_id && !isAssignedToMe;
    const isInProgressByOther = isAssignedToOther && ['assigned', 'in_progress', 'work_submitted'].includes(a.status);
    
    // Show: new assignments, ready for assignment, or assigned to me
    // Hide: in-progress by others, completed, cancelled
    return !isInProgressByOther && !['completed', 'cancelled'].includes(a.status);
  });

  // Completed assignments for "Reference Library" tab
  const completedAssignments = allAssignments.filter(a => a.status === 'completed');

  const filteredMyAssignments = myAssignments.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/consultant')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
                <p className="text-sm text-gray-600">View assignments and work on assigned ones</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow p-1 flex">
          <button
            onClick={() => { setActiveTab('my'); setFilter('all'); }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'my'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Briefcase size={20} />
            My Work ({myAssignments.length})
          </button>
          <button
            onClick={() => { setActiveTab('available'); setFilter('all'); }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'available'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users size={20} />
            New Requests ({availableAssignments.length})
          </button>
          <button
            onClick={() => { setActiveTab('library'); setFilter('all'); }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'library'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookOpen size={20} />
            Reference Library ({completedAssignments.length})
          </button>
        </div>
      </div>

      {/* Info Banners */}
      {activeTab === 'available' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-medium text-blue-900">Express Your Interest</p>
                <p className="text-xs text-blue-700 mt-1">
                  Click "Express Interest" on assignments you'd like to work on. Management will assign work to you after client payment is verified.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <BookOpen className="text-green-600 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-medium text-green-900">Reference Library</p>
                <p className="text-xs text-green-700 mt-1">
                  Review completed assignments to learn from past work and understand quality standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters for My Work tab */}
      {activeTab === 'my' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'assigned', 'in_progress', 'work_submitted', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  filter === f
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? 'All' : getStatusLabel(f).replace(/^[^\s]+\s/, '')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : activeTab === 'my' ? (
          // My Assigned Work Tab
          filteredMyAssignments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments assigned to you yet</h3>
              <p className="text-gray-600 mb-4">
                Browse new requests and express your interest. Management will assign work to you.
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                View New Requests
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredMyAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                      <p className="text-sm text-gray-600">{assignment.subject}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                      {getStatusLabel(assignment.status)}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{assignment.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>Client: {assignment.client_name}</span>
                    </div>
                    {assignment.deadline && (
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    {assignment.final_price && (
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} />
                        <span>{assignment.currency} {Number(assignment.final_price).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-between">
                    <button 
                      onClick={() => openDetailsModal(assignment)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Eye size={18} />
                      View Details
                    </button>
                    <button 
                      onClick={() => router.push(`/dashboard/consultant/assignments/${assignment.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      <Briefcase size={18} />
                      Work on Assignment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'available' ? (
          // Available/New Requests Tab
          availableAssignments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No new requests available</h3>
              <p className="text-gray-600">Check back later for new assignment requests.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {availableAssignments.map((assignment) => {
                const isAssignedToMe = myAssignments.some(a => a.id === assignment.id);
                const hasApplied = assignment.has_applied > 0;
                const applicationPending = assignment.application_status === 'pending';
                const workflow = getWorkflowStage(assignment.status);
                
                return (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    {/* Workflow Stage Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${workflow.color}`}>
                        {workflow.label}
                      </span>
                      {isAssignedToMe && (
                        <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                          ✓ Assigned to You
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                        <p className="text-sm text-gray-600">{assignment.subject}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                        {getStatusLabel(assignment.status)}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{assignment.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>Client: {assignment.client_name}</span>
                      </div>
                      {assignment.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                      {(assignment.final_price || assignment.proposed_price) && (
                        <div className="flex items-center gap-1">
                          <DollarSign size={16} />
                          <span>{assignment.currency} {Number(assignment.final_price || assignment.proposed_price).toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      {isAssignedToMe ? (
                        <button
                          onClick={() => router.push(`/dashboard/consultant/assignments/${assignment.id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          <Briefcase size={18} />
                          Work on Assignment
                        </button>
                      ) : hasApplied ? (
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            assignment.application_status === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : assignment.application_status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {assignment.application_status === 'approved' 
                              ? '✅ Interest Approved'
                              : assignment.application_status === 'rejected'
                              ? '❌ Not Selected'
                              : '⏳ Interest Submitted'}
                          </span>
                          {applicationPending && (
                            <button
                              onClick={() => handleWithdrawApplication(assignment.id)}
                              className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                            >
                              <XCircle size={16} />
                              Withdraw
                            </button>
                          )}
                        </div>
                      ) : applyingTo === assignment.id ? (
                        <div className="flex-1 space-y-3">
                          <textarea
                            value={applicationMessage}
                            onChange={(e) => setApplicationMessage(e.target.value)}
                            placeholder="Why do you want to work on this? (Optional)"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApply(assignment.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                              <Send size={16} />
                              Submit
                            </button>
                            <button
                              onClick={() => {
                                setApplyingTo(null);
                                setApplicationMessage('');
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setApplyingTo(assignment.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          <Send size={18} />
                          Express Interest
                        </button>
                      )}
                      
                      <button
                        onClick={() => openDetailsModal(assignment)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye size={18} />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // Reference Library Tab (Completed Assignments)
          completedAssignments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No completed assignments yet</h3>
              <p className="text-gray-600">Completed assignments will appear here for reference.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {completedAssignments.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          ✓ Completed
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{assignment.subject}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{assignment.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>Client: {assignment.client_name}</span>
                    </div>
                    {assignment.assigned_consultant_name && (
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>By: {assignment.assigned_consultant_name}</span>
                      </div>
                    )}
                    {assignment.final_price && (
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} />
                        <span>{assignment.currency} {Number(assignment.final_price).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Files Section */}
                  {(assignment.has_final_work || assignment.final_submission_filename) && (
                    <div className="bg-emerald-50 rounded-lg p-3 mb-4">
                      <p className="text-xs font-semibold text-emerald-800 mb-2">📁 Completed Work Files</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.final_submission_filename && (
                          <a
                            href={`/api/assignment-requests/${assignment.id}/final-work?token=${localStorage.getItem('auth-token')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700"
                          >
                            <FileText size={14} />
                            <span>{assignment.final_submission_filename}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={() => openDetailsModal(assignment)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <BookOpen size={18} />
                      View for Reference
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* View Details Modal */}
      {showDetailsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-emerald-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{selectedAssignment.title}</h3>
                <p className="text-emerald-100 text-sm">{selectedAssignment.subject}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Status */}
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAssignment.status)}`}>
                  {getStatusLabel(selectedAssignment.status)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getWorkflowStage(selectedAssignment.status).color}`}>
                  {getWorkflowStage(selectedAssignment.status).label}
                </span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedAssignment.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Client</p>
                  <p className="font-medium text-gray-900">{selectedAssignment.client_name}</p>
                </div>
                {selectedAssignment.deadline && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Deadline</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedAssignment.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {(selectedAssignment.final_price || selectedAssignment.proposed_price) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Price</p>
                    <p className="font-medium text-gray-900">
                      {selectedAssignment.currency} {Number(selectedAssignment.final_price || selectedAssignment.proposed_price).toFixed(2)}
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Submitted</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedAssignment.created_at).toLocaleDateString()}
                  </p>
                </div>
                {selectedAssignment.assigned_consultant_name && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                    <p className="font-medium text-gray-900">{selectedAssignment.assigned_consultant_name}</p>
                  </div>
                )}
              </div>

              {/* Application Status */}
              {selectedAssignment.has_applied > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-purple-900">Your Interest Status</p>
                  <p className="text-purple-700 mt-1">
                    {selectedAssignment.application_status === 'approved' 
                      ? '✅ Your interest was approved! This assignment should appear in "My Work".'
                      : selectedAssignment.application_status === 'rejected'
                      ? '❌ Not selected for this assignment.'
                      : '⏳ Your interest has been submitted. Management will review it.'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
              {myAssignments.some(a => a.id === selectedAssignment.id) && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    router.push(`/dashboard/consultant/assignments/${selectedAssignment.id}`);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Work on Assignment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
