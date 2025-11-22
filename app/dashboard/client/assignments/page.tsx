'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Clock, CheckCircle, XCircle, Plus, Search, Filter,
  DollarSign, Upload, Eye, Download, MessageSquare, AlertCircle, ArrowLeft
} from 'lucide-react';

interface AssignmentRequest {
  id: number;
  title: string;
  subject: string;
  description: string;
  status: string;
  deadline: string | null;
  proposed_price: number | null;
  final_price: number | null;
  currency: string;
  doctor_name: string | null;
  doctor_notes: string | null;
  has_attachment: boolean;
  has_receipt: boolean;
  created_at: string;
  price_proposed_at: string | null;
  final_submission_filename: string | null;
  client_review_status: string | null;
}

export default function ClientAssignmentsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AssignmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'deadline'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      console.log('[Client Assignments] Fetching assignments with token:', !!token);
      
      const response = await fetch('/api/assignment-requests', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      console.log('[Client Assignments] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Client Assignments] Received data:', data);
        console.log('[Client Assignments] Number of assignments:', data.length);
        setRequests(data);
      } else {
        const errorData = await response.json();
        console.error('[Client Assignments] Error response:', errorData);
      }
    } catch (error) {
      console.error('[Client Assignments] Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any; label: string; description: string }> = {
      pending_review: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        label: 'Pending Review',
        description: 'Waiting for doctor to review'
      },
      under_review: {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: Eye,
        label: 'Under Review',
        description: 'Doctor is reviewing your request'
      },
      price_proposed: {
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: DollarSign,
        label: 'Price Proposed',
        description: 'Doctor has proposed a price - Action required'
      },
      negotiating: {
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: MessageSquare,
        label: 'Negotiating',
        description: 'Price negotiation in progress'
      },
      accepted: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        label: 'Accepted',
        description: 'Price accepted, proceed to payment'
      },
      payment_pending: {
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        icon: Upload,
        label: 'Payment Pending',
        description: 'Upload payment receipt - Action required'
      },
      payment_uploaded: {
        color: 'bg-teal-100 text-teal-800 border-teal-300',
        icon: Clock,
        label: 'Payment Uploaded',
        description: 'Waiting for payment verification'
      },
      payment_verified: {
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: CheckCircle,
        label: 'Payment Verified',
        description: 'Payment confirmed, work will begin'
      },
      in_progress: {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: FileText,
        label: 'In Progress',
        description: 'Doctor is working on your assignment'
      },
      completed: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        label: 'Completed',
        description: 'Assignment completed'
      },
      rejected: {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle,
        label: 'Rejected',
        description: 'Request was rejected'
      },
      cancelled: {
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: XCircle,
        label: 'Cancelled',
        description: 'Request was cancelled'
      },
    };

    return statusMap[status] || statusMap.pending_review;
  };

  // Filter, search, and sort requests
  const filteredRequests = requests
    .filter(req => {
      // Status filter
      if (filter === 'all') return true;
      if (filter === 'active') return ['pending_review', 'under_review', 'price_proposed', 'negotiating', 'payment_pending', 'payment_uploaded', 'payment_verified', 'in_progress'].includes(req.status);
      if (filter === 'completed') return req.status === 'completed';
      if (filter === 'action_required') return ['price_proposed', 'payment_pending'].includes(req.status);
      return true;
    })
    .filter(req => {
      // Search filter
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        req.title.toLowerCase().includes(search) ||
        req.subject.toLowerCase().includes(search) ||
        req.description.toLowerCase().includes(search) ||
        (req.doctor_name && req.doctor_name.toLowerCase().includes(search))
      );
    })
    .sort((a, b) => {
      // Sorting
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'price') {
        const priceA = a.final_price || a.proposed_price || 0;
        const priceB = b.final_price || b.proposed_price || 0;
        comparison = priceA - priceB;
      } else if (sortBy === 'deadline') {
        const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        comparison = deadlineA - deadlineB;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const actionRequiredCount = requests.filter(r => ['price_proposed', 'payment_pending'].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => router.push('/dashboard/client')}
                className="text-white hover:text-emerald-100 transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">My Assignment Requests</h1>
                <p className="text-xs sm:text-sm text-emerald-100 mt-1">Track and manage your assignment requests</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/client/assignments/request')}
              className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">New Request</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Required Alert */}
        {actionRequiredCount > 0 && (
          <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="text-orange-500 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-orange-900">Action Required</h3>
                <p className="text-sm text-orange-700">
                  You have {actionRequiredCount} request{actionRequiredCount > 1 ? 's' : ''} that need your attention
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Sort */}
        <div className="mb-6 bg-white rounded-xl shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">Search assignments</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
                <input
                  id="search"
                  type="text"
                  placeholder="Search by title, subject, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  aria-label="Search assignments"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'deadline')}
                className="flex-1 px-3 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                aria-label="Sort by"
              >
                <option value="date">Sort by Date</option>
                <option value="price">Sort by Price</option>
                <option value="deadline">Sort by Deadline</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 border-2 border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-500 transition-all font-bold text-lg"
                aria-label={`Sort order: ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6" role="group" aria-label="Filter assignments by status">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'All', count: requests.length },
              { key: 'action_required', label: 'Action Required', count: actionRequiredCount },
              { key: 'active', label: 'Active', count: requests.filter(r => ['pending_review', 'under_review', 'price_proposed', 'negotiating', 'payment_pending', 'payment_uploaded', 'in_progress'].includes(r.status)).length },
              { key: 'completed', label: 'Completed', count: requests.filter(r => r.status === 'completed').length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2.5 rounded-lg font-semibold transition-all whitespace-nowrap shadow-sm ${
                  filter === key
                    ? 'bg-emerald-600 text-white shadow-md scale-105'
                    : 'bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border-2 border-gray-200'
                }`}
                aria-label={`Show ${label.toLowerCase()} assignments, ${count} total`}
                aria-pressed={filter === key}
              >
                {label} <span className="ml-1 font-bold">({count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State with Skeletons */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                  <div className="w-24 h-8 bg-gray-200 rounded-full"></div>
                </div>
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRequests.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-lg shadow">
            <div className="max-w-md mx-auto">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 p-6">
                  <FileText size={48} className="text-emerald-600" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {filter === 'all' ? 'No Assignments Yet' : `No ${filter.replace('_', ' ')} Assignments`}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                {filter === 'all' 
                  ? "You haven't submitted any assignment requests yet. Get started by submitting your first request and connect with our expert consultants."
                  : `You don't have any assignments in the "${filter.replace('_', ' ')}" category. Try viewing all assignments or check other categories.`}
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {filter === 'all' ? (
                  <button
                    onClick={() => router.push('/dashboard/client/assignments/request')}
                    className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-sm"
                  >
                    <Plus size={20} />
                    <span>Submit First Request</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setFilter('all')}
                    className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-sm"
                  >
                    View All Assignments
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Requests List */}
        {!loading && filteredRequests.length > 0 && (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusInfo = getStatusInfo(request.status);
              const StatusIcon = statusInfo.icon;
              const needsAction = ['price_proposed', 'payment_pending'].includes(request.status);
              const hasFinalWork = request.final_submission_filename && request.client_review_status === 'pending';

              return (
                <article
                  key={request.id}
                  className={`bg-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer border-2 ${
                    needsAction ? 'border-orange-300' : 'border-transparent'
                  }`}
                  onClick={() => router.push(`/dashboard/client/assignments/${request.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/dashboard/client/assignments/${request.id}`);
                    }
                  }}
                  aria-label={`View assignment: ${request.title}, Status: ${statusInfo.label}${needsAction ? ', Action required' : ''}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{request.title}</h3>
                          {needsAction && (
                            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                              ACTION NEEDED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{request.subject}</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{request.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full border ${statusInfo.color} flex items-center space-x-1`}>
                        <StatusIcon size={16} />
                        <span className="text-xs font-semibold">{statusInfo.label}</span>
                      </div>
                    </div>

                    {/* Price Info */}
                    {request.proposed_price && (
                      <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-purple-900">Proposed Price:</span>
                          <span className="text-lg font-bold text-purple-700">
                            {request.currency} ${request.final_price || request.proposed_price}
                          </span>
                        </div>
                        {request.doctor_notes && (
                          <p className="text-xs text-purple-700 mt-2">
                            <strong>Note:</strong> {request.doctor_notes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Final Work Notification */}
                    {hasFinalWork && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300 animate-pulse">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="text-green-600" size={20} />
                          <span className="text-sm font-bold text-green-900">
                            ✅ Final work submitted! Click to review and accept/reject
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        {request.doctor_name && (
                          <span>👨‍⚕️ {request.doctor_name}</span>
                        )}
                        {request.has_attachment && (
                          <span className="flex items-center space-x-1">
                            <FileText size={14} />
                            <span>Attachment</span>
                          </span>
                        )}
                        {request.deadline && (
                          <span>📅 Due: {new Date(request.deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        Submitted {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Status Description */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 italic">{statusInfo.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
