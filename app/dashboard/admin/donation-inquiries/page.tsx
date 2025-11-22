'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Phone, DollarSign, Calendar, Eye, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DonationInquiry {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  amount: string | null;
  message: string;
  status: 'pending' | 'contacted' | 'completed';
  created_at: string;
}

export default function DonationInquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<DonationInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<DonationInquiry | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'contacted' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/donation-inquiries', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInquiries(data.inquiries);
      }
    } catch (error) {
      console.error('Error loading inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: 'pending' | 'contacted' | 'completed') => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/donation-inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        loadInquiries();
        if (selectedInquiry?.id === id) {
          setSelectedInquiry({ ...selectedInquiry, status });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredInquiries = filter === 'all' 
    ? inquiries 
    : inquiries.filter(i => i.status === filter);

  // Pagination
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInquiries = filteredInquiries.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Mail size={16} />;
      case 'contacted': return <Phone size={16} />;
      case 'completed': return <Check size={16} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Donation Inquiries</h1>
                <p className="text-sm text-gray-600">Manage large donation requests</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Inquiries</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Mail size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Inquiries Yet</h2>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Donation inquiries will appear here when donors submit the form.'
                : `No ${filter} inquiries found.`}
            </p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Inquiries List */}
            <div className="lg:col-span-1 space-y-4">
              {paginatedInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  onClick={() => setSelectedInquiry(inquiry)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedInquiry?.id === inquiry.id ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{inquiry.name}</h3>
                      <p className="text-sm text-gray-600">{inquiry.email}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                      {getStatusIcon(inquiry.status)}
                      <span className="ml-1 capitalize">{inquiry.status}</span>
                    </span>
                  </div>
                  {inquiry.amount && (
                    <div className="flex items-center text-sm text-emerald-700 font-semibold mb-2">
                      <DollarSign size={14} className="mr-1" />
                      {inquiry.amount}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{inquiry.message}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar size={12} className="mr-1" />
                    {new Date(inquiry.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Inquiry Details */}
            <div className="lg:col-span-2">
              {selectedInquiry ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedInquiry.name}</h2>
                      <div className="space-y-1">
                        <div className="flex items-center text-gray-600">
                          <Mail size={16} className="mr-2" />
                          <a href={`mailto:${selectedInquiry.email}`} className="hover:text-emerald-700">
                            {selectedInquiry.email}
                          </a>
                        </div>
                        {selectedInquiry.phone && (
                          <div className="flex items-center text-gray-600">
                            <Phone size={16} className="mr-2" />
                            <a href={`tel:${selectedInquiry.phone}`} className="hover:text-emerald-700">
                              {selectedInquiry.phone}
                            </a>
                          </div>
                        )}
                        {selectedInquiry.amount && (
                          <div className="flex items-center text-emerald-700 font-semibold">
                            <DollarSign size={16} className="mr-2" />
                            {selectedInquiry.amount}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInquiry.status)}`}>
                      {getStatusIcon(selectedInquiry.status)}
                      <span className="ml-2 capitalize">{selectedInquiry.status}</span>
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Message:</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-800 whitespace-pre-wrap">{selectedInquiry.message}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Received:</h3>
                    <p className="text-gray-600">
                      {new Date(selectedInquiry.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Update Status:</h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => updateStatus(selectedInquiry.id, 'pending')}
                        className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all ${
                          selectedInquiry.status === 'pending'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        <Mail size={16} className="inline mr-2" />
                        Pending
                      </button>
                      <button
                        onClick={() => updateStatus(selectedInquiry.id, 'contacted')}
                        className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all ${
                          selectedInquiry.status === 'contacted'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        <Phone size={16} className="inline mr-2" />
                        Contacted
                      </button>
                      <button
                        onClick={() => updateStatus(selectedInquiry.id, 'completed')}
                        className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all ${
                          selectedInquiry.status === 'completed'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        <Check size={16} className="inline mr-2" />
                        Completed
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <a
                      href={`mailto:${selectedInquiry.email}?subject=Re: Donation Inquiry&body=Dear ${selectedInquiry.name},%0D%0A%0D%0AThank you for your interest in supporting MedConsult Liberia.`}
                      className="flex-1 px-4 py-2 bg-emerald-700 text-white text-center rounded-md hover:bg-emerald-800 transition-all"
                    >
                      <Mail size={16} className="inline mr-2" />
                      Send Email
                    </a>
                    {selectedInquiry.phone && (
                      <a
                        href={`tel:${selectedInquiry.phone}`}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-all"
                      >
                        <Phone size={16} className="inline mr-2" />
                        Call
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <Eye size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select an Inquiry</h3>
                  <p className="text-gray-600">Click on an inquiry to view details and take action</p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredInquiries.length)} of {filteredInquiries.length} inquiries
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === page
                        ? 'bg-emerald-700 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </main>
    </div>
  );
}
