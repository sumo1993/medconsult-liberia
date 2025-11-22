'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Save, X, Check, XCircle, Clock, Eye, Globe, EyeOff, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminPartnershipsPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    logo: '',
    description: '',
    website: '',
    contact_email: '',
    contact_phone: '',
    display_order: 0
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [viewingPartner, setViewingPartner] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      console.log('Fetching partnerships with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('/api/partnerships', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Partnerships fetched:', data.length);
        setPartners(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch partnerships:', errorText);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/partnerships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ name: '', type: '', logo: '', description: '', website: '', contact_email: '', contact_phone: '', display_order: 0 });
        fetchPartners();
        setSuccessMessage('Partnership request submitted successfully!');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error creating partner:', error);
    }
  };

  const handleStatusChange = async (id: number, action: 'approve' | 'reject' | 'publish' | 'unpublish') => {
    try {
      const token = localStorage.getItem('auth-token');
      console.log('[Admin] Updating partnership status:', { id, action, token: token ? 'Present' : 'Missing' });
      
      const url = `/api/partnerships/${id}/approve`;
      console.log('[Admin] Request URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action }),
      });

      console.log('[Admin] Response status:', response.status);
      console.log('[Admin] Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('[Admin] Success response:', result);
        await fetchPartners();
        const messages = {
          approve: 'Partnership approved successfully!',
          reject: 'Partnership rejected successfully!',
          publish: 'Partnership published to public page!',
          unpublish: 'Partnership unpublished from public page!'
        };
        setSuccessMessage(messages[action]);
        setShowSuccessModal(true);
      } else {
        const errorText = await response.text();
        console.error('[Admin] Failed to update partnership:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        alert(`Failed to update partnership (${response.status}): ${errorText}`);
      }
    } catch (error: any) {
      console.error('[Admin] Error updating partnership:', error);
      alert(`An error occurred: ${error?.message || 'Unknown error'}`);
    }
  };

  const filteredPartners = filter === 'all' 
    ? partners 
    : partners.filter(p => p.status === filter);

  const pendingCount = partners.filter(p => p.status === 'pending').length;
  const approvedCount = partners.filter(p => p.status === 'approved').length;

  // Pagination
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPartners = filteredPartners.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  return (
    <>
      {/* View Partner Details Modal */}
      {viewingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingPartner(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                {viewingPartner.status === 'pending' && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Clock size={16} />
                    Pending
                  </span>
                )}
                {viewingPartner.status === 'approved' && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Check size={16} />
                    Approved
                  </span>
                )}
                {viewingPartner.status === 'rejected' && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold flex items-center gap-1">
                    <XCircle size={16} />
                    Rejected
                  </span>
                )}
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{viewingPartner.name}</h2>
              <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                {viewingPartner.type}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Description</h3>
                <p className="text-gray-700">{viewingPartner.description}</p>
              </div>

              {viewingPartner.contact_email && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Contact Email</h3>
                  <a href={`mailto:${viewingPartner.contact_email}`} className="text-emerald-600 hover:underline">
                    {viewingPartner.contact_email}
                  </a>
                </div>
              )}

              {viewingPartner.contact_phone && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Contact Phone</h3>
                  <a href={`tel:${viewingPartner.contact_phone}`} className="text-emerald-600 hover:underline">
                    {viewingPartner.contact_phone}
                  </a>
                </div>
              )}

              {viewingPartner.website && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Website</h3>
                  <a href={viewingPartner.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    {viewingPartner.website}
                  </a>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Submitted Date</h3>
                <p className="text-gray-700">{new Date(viewingPartner.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              {viewingPartner.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleStatusChange(viewingPartner.id, 'approve');
                      setViewingPartner(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    <Check size={20} />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(viewingPartner.id, 'reject');
                      setViewingPartner(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    <XCircle size={20} />
                    Reject
                  </button>
                </>
              )}
              {viewingPartner.status === 'approved' && (
                <button
                  onClick={() => {
                    handleStatusChange(viewingPartner.id, 'publish');
                    setViewingPartner(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  <Globe size={20} />
                  Publish to Public Page
                </button>
              )}
              {viewingPartner.status === 'published' && (
                <button
                  onClick={() => {
                    handleStatusChange(viewingPartner.id, 'unpublish');
                    setViewingPartner(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
                >
                  <EyeOff size={20} />
                  Unpublish from Public Page
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Check className="text-emerald-600" size={32} />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Success!
              </h3>
              
              <p className="text-gray-600 mb-6">
                {successMessage}
              </p>
              
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Manage Partnerships</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
            >
              {showForm ? <X size={20} /> : <Plus size={20} />}
              {showForm ? 'Cancel' : 'Add Partner'}
            </button>
          </div>
        </div>

        {/* Add Partner Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Partner</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partner Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Type</option>
                    <option value="Government">Government</option>
                    <option value="International">International</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="NGO">NGO</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
              >
                <Save size={20} />
                Save Partner
              </button>
            </form>
          </div>
        )}

        {/* Partners List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Partnership Requests</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                All ({partners.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-semibold ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-semibold ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Approved ({approvedCount})
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            </div>
          ) : filteredPartners.length > 0 ? (
            <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedPartners.map((partner) => (
                <div key={partner.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{partner.name}</h3>
                    {partner.status === 'pending' && <Clock className="text-yellow-500" size={20} />}
                    {partner.status === 'approved' && <Check className="text-green-500" size={20} />}
                    {partner.status === 'rejected' && <XCircle className="text-red-500" size={20} />}
                  </div>
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold mb-2">
                    {partner.type}
                  </span>
                  <p className="text-xs text-gray-500 mb-2">Status: <span className="font-semibold">{partner.status}</span></p>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{partner.description}</p>
                  
                  <button
                    onClick={() => setViewingPartner(partner)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold mb-3"
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                  
                  {partner.status === 'pending' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <button
                        onClick={() => handleStatusChange(partner.id, 'approve')}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                      >
                        <Check size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(partner.id, 'reject')}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  )}
                  {partner.status === 'approved' && (
                    <button
                      onClick={() => handleStatusChange(partner.id, 'publish')}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold mt-3 pt-3 border-t"
                    >
                      <Globe size={16} />
                      Publish
                    </button>
                  )}
                  {partner.status === 'published' && (
                    <button
                      onClick={() => handleStatusChange(partner.id, 'unpublish')}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-semibold mt-3 pt-3 border-t"
                    >
                      <EyeOff size={16} />
                      Unpublish
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredPartners.length)} of {filteredPartners.length} partnerships
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === page
                            ? 'bg-emerald-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No partners added yet. Click "Add Partner" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
