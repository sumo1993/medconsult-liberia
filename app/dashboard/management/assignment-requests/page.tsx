'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Clock, DollarSign, Eye, CheckCircle, 
  FileText, AlertCircle, Filter, Search 
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
  client_name: string;
  client_email: string;
  doctor_name: string | null;
  has_attachment: boolean;
  created_at: string;
  price_proposed_at: string | null;
}

export default function DoctorAssignmentRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AssignmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/assignment-requests', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any; label: string }> = {
      pending_review: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        label: 'Pending Review'
      },
      under_review: {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: Eye,
        label: 'Under Review'
      },
      price_proposed: {
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: DollarSign,
        label: 'Price Proposed'
      },
      negotiating: {
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: AlertCircle,
        label: 'Negotiating'
      },
      accepted: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        label: 'Accepted'
      },
      payment_pending: {
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        icon: Clock,
        label: 'Payment Pending'
      },
      payment_uploaded: {
        color: 'bg-teal-100 text-teal-800 border-teal-300',
        icon: AlertCircle,
        label: 'Payment Uploaded - Verify'
      },
      payment_verified: {
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: CheckCircle,
        label: 'Payment Verified'
      },
      in_progress: {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: FileText,
        label: 'In Progress'
      },
      completed: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        label: 'Completed'
      },
    };

    return statusMap[status] || statusMap.pending_review;
  };

  const filteredRequests = requests.filter(req => {
    // Status filter
    let statusMatch = false;
    if (filter === 'pending') {
      statusMatch = req.status === 'pending_review';
    } else if (filter === 'action_required') {
      statusMatch = ['negotiating', 'payment_uploaded'].includes(req.status);
    } else if (filter === 'awaiting_client') {
      statusMatch = ['price_proposed', 'payment_pending'].includes(req.status);
    } else if (filter === 'active') {
      statusMatch = ['under_review', 'accepted', 'payment_verified', 'in_progress'].includes(req.status);
    } else if (filter === 'completed') {
      statusMatch = req.status === 'completed';
    } else {
      statusMatch = true;
    }

    // Search filter
    const searchMatch = searchTerm === '' || 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.subject.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  const pendingCount = requests.filter(r => r.status === 'pending_review').length;
  const actionRequiredCount = requests.filter(r => ['negotiating', 'payment_uploaded'].includes(r.status)).length;
  const awaitingClientCount = requests.filter(r => ['price_proposed', 'payment_pending'].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Action Required Alert */}
        {actionRequiredCount > 0 && (
          <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="text-orange-500 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-orange-900">Action Required</h3>
                <p className="text-sm text-orange-700">
                  {actionRequiredCount} request{actionRequiredCount > 1 ? 's' : ''} need your attention (negotiations or payment verification)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, client name, or subject..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Filter Buttons - Desktop */}
          <div className="hidden md:flex space-x-2 overflow-x-auto pb-2">
            {[
              { key: 'pending', label: 'Pending Review', count: pendingCount, color: 'yellow' },
              { key: 'action_required', label: 'Action Required', count: actionRequiredCount, color: 'orange' },
              { key: 'awaiting_client', label: 'Awaiting Client', count: awaitingClientCount, color: 'purple' },
              { key: 'active', label: 'Active Work', count: requests.filter(r => ['under_review', 'accepted', 'payment_verified', 'in_progress'].includes(r.status)).length, color: 'blue' },
              { key: 'completed', label: 'Completed', count: requests.filter(r => r.status === 'completed').length, color: 'green' },
              { key: 'all', label: 'All', count: requests.length, color: 'gray' },
            ].map(({ key, label, count, color }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filter === key
                    ? `bg-${color}-600 text-white shadow-lg`
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                style={filter === key ? {
                  backgroundColor: color === 'yellow' ? '#ca8a04' : 
                                  color === 'orange' ? '#ea580c' :
                                  color === 'purple' ? '#9333ea' :
                                  color === 'blue' ? '#2563eb' :
                                  color === 'green' ? '#16a34a' : '#4b5563'
                } : {}}
              >
                {label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  filter === key ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
              <Clock className="text-yellow-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Need Action</p>
                <p className="text-2xl font-bold text-gray-900">{actionRequiredCount}</p>
              </div>
              <AlertCircle className="text-orange-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Awaiting Client</p>
                <p className="text-2xl font-bold text-gray-900">{awaitingClientCount}</p>
              </div>
              <Clock className="text-purple-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'in_progress' || r.status === 'payment_verified').length}
                </p>
              </div>
              <FileText className="text-blue-500" size={32} />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading requests...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRequests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search' : `No ${filter.replace('_', ' ')} requests`}
            </p>
          </div>
        )}

        {/* Requests List */}
        {!loading && filteredRequests.length > 0 && (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusInfo = getStatusInfo(request.status);
              const StatusIcon = statusInfo.icon;
              const needsAction = ['negotiating', 'payment_uploaded'].includes(request.status);

              return (
                <div
                  key={request.id}
                  className={`bg-white rounded-lg shadow hover:shadow-xl transition-all cursor-pointer border-2 ${
                    needsAction ? 'border-orange-400 ring-2 ring-orange-200' : 'border-transparent'
                  }`}
                  onClick={() => router.push(`/dashboard/management/assignment-requests/${request.id}`)}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900">{request.title}</h3>
                          {needsAction && (
                            <span className="px-2 sm:px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                              ACTION NEEDED
                            </span>
                          )}
                          {request.status === 'pending_review' && (
                            <span className="px-2 sm:px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{request.subject}</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{request.description}</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full border ${statusInfo.color} flex items-center space-x-1 self-start`}>
                        <StatusIcon size={16} />
                        <span className="text-xs font-semibold whitespace-nowrap">{statusInfo.label}</span>
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">👤 {request.client_name}</p>
                          <p className="text-xs text-gray-600">{request.client_email}</p>
                        </div>
                        {request.proposed_price && (
                          <div className="sm:text-right">
                            <p className="text-xs text-gray-600">Proposed Price</p>
                            <p className="text-lg font-bold text-purple-700">
                              {request.currency} ${request.final_price || request.proposed_price}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                      <div className="flex flex-wrap items-center gap-3 text-gray-600 text-xs sm:text-sm">
                        {request.has_attachment && (
                          <span className="flex items-center space-x-1">
                            <FileText size={14} />
                            <span>Has Attachment</span>
                          </span>
                        )}
                        {request.deadline && (
                          <span>📅 Due: {new Date(request.deadline).toLocaleDateString()}</span>
                        )}
                        <span className="text-xs text-gray-500">
                          Submitted {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/management/assignment-requests/${request.id}`);
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm font-medium"
                      >
                        {request.status === 'pending_review' ? 'Review & Price' :
                         request.status === 'negotiating' ? 'Respond to Negotiation' :
                         request.status === 'payment_uploaded' ? 'Verify Payment' :
                         'View Details'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="grid grid-cols-3 gap-1.5 px-1.5 py-1.5">
            {[
              { key: 'pending', label: 'Pending', count: pendingCount, color: 'yellow' },
              { key: 'action_required', label: 'Action', count: actionRequiredCount, color: 'orange' },
              { key: 'awaiting_client', label: 'Awaiting', count: awaitingClientCount, color: 'purple' },
              { key: 'active', label: 'Active', count: requests.filter(r => ['under_review', 'accepted', 'payment_verified', 'in_progress'].includes(r.status)).length, color: 'blue' },
              { key: 'completed', label: 'Done', count: requests.filter(r => r.status === 'completed').length, color: 'green' },
              { key: 'all', label: 'All', count: requests.length, color: 'gray' },
            ].map(({ key, label, count, color }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-1.5 py-1.5 rounded-md font-medium transition-all text-[10px] ${
                  filter === key
                    ? `text-white shadow-sm`
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
                style={filter === key ? {
                  backgroundColor: color === 'yellow' ? '#ca8a04' : 
                                  color === 'orange' ? '#ea580c' :
                                  color === 'purple' ? '#9333ea' :
                                  color === 'blue' ? '#2563eb' :
                                  color === 'green' ? '#16a34a' : '#4b5563'
                } : {}}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="leading-tight">{label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none ${
                    filter === key ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
