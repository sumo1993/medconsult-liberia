'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Mail, Phone, FileText, Calendar, Check, X, Eye, Clock } from 'lucide-react';

interface Application {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  specialty: string;
  experience: number;
  education: string;
  license_number: string;
  availability: string;
  motivation: string;
  resume_filename: string | null;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function TeamApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/team-applications' 
        : `/api/team-applications?status=${filter}`;
      
      console.log('Fetching applications from:', url);
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Applications data:', data);
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          setApplications(data);
        } else {
          console.error('Data is not an array:', data);
          setApplications([]);
        }
      } else {
        console.error('Response not OK:', await response.text());
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = (app: Application) => {
    setSelectedApp(app);
    setAdminNotes(app.admin_notes || '');
    setShowModal(true);
  };

  const handleUpdateStatus = async (status: 'reviewing' | 'approved' | 'rejected') => {
    if (!selectedApp) return;

    try {
      console.log('Updating application status to:', status);
      const response = await fetch('/api/team-applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          status,
          adminNotes
        })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Update successful:', data);
        setToast({ show: true, message: `Application ${status} successfully!`, type: 'success' });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        setShowModal(false);
        fetchApplications();
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        setToast({ show: true, message: `Failed: ${errorData.error || 'Unknown error'}`, type: 'error' });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      setToast({ show: true, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/dashboard/admin')} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Applications</h1>
              <p className="text-gray-600 mt-2">Review and manage applications to join the team</p>
            </div>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => {
                  setLoading(true);
                  fetchApplications();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                🔄 Refresh
              </button>
              <div className="bg-emerald-600 text-white px-6 py-3 rounded-lg">
                <p className="text-sm opacity-90">Total Applications</p>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            {['all', 'pending', 'reviewing', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filter === status
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-xl font-semibold text-gray-900 mb-2">No applications yet</p>
              <p className="text-gray-600 mb-4">Applications will appear here when people apply to join your team</p>
              <p className="text-sm text-gray-500">
                Share the application link: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/apply-team</span>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Applicant</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Specialty</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Experience</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Applied</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{app.full_name}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail size={14} /> {app.email}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone size={14} /> {app.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{app.specialty}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{app.experience} years</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar size={14} />
                          {formatDate(app.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewApplication(app)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold"
                        >
                          <Eye size={16} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-semibold">{selectedApp.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedApp.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{selectedApp.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Specialty</p>
                    <p className="font-semibold">{selectedApp.specialty}</p>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Professional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Years of Experience</p>
                    <p className="font-semibold">{selectedApp.experience} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">License Number</p>
                    <p className="font-semibold">{selectedApp.license_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Availability</p>
                    <p className="font-semibold">{selectedApp.availability}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-2">Resume</p>
                    {selectedApp.resume_filename ? (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <FileText className="text-blue-600" size={20} />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{selectedApp.resume_filename}</p>
                          <p className="text-xs text-gray-500">View or download the resume file</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              // Check if file exists first
                              const checkResponse = await fetch(`/uploads/resumes/${selectedApp.resume_filename}`, { method: 'HEAD' });
                              if (checkResponse.ok) {
                                setPdfUrl(`/uploads/resumes/${selectedApp.resume_filename}`);
                                setShowPdfViewer(true);
                              } else {
                                setToast({ show: true, message: 'File not found on server. This application was submitted before file upload was implemented.', type: 'error' });
                                setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
                              }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm flex items-center gap-2"
                          >
                            <Eye size={16} /> View
                          </button>
                          <a
                            href={`/api/download-resume/${selectedApp.resume_filename}`}
                            download
                            onClick={async (e) => {
                              e.preventDefault();
                              const checkResponse = await fetch(`/uploads/resumes/${selectedApp.resume_filename}`, { method: 'HEAD' });
                              if (checkResponse.ok) {
                                window.location.href = `/api/download-resume/${selectedApp.resume_filename}`;
                              } else {
                                setToast({ show: true, message: 'File not found on server. This application was submitted before file upload was implemented.', type: 'error' });
                                setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm flex items-center gap-2"
                          >
                            <FileText size={16} /> Download
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Not provided</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Education & Qualifications</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedApp.education}</p>
              </div>

              {/* Motivation */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Motivation</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedApp.motivation}</p>
              </div>

              {/* Admin Notes */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  rows={4}
                  placeholder="Add notes about this application..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t">
                {selectedApp.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus('reviewing')}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
                  >
                    <Clock size={20} /> Mark as Reviewing
                  </button>
                )}
                <button
                  onClick={() => handleUpdateStatus('approved')}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                >
                  <Check size={20} /> Approve
                </button>
                <button
                  onClick={() => handleUpdateStatus('rejected')}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center justify-center gap-2"
                >
                  <X size={20} /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPdfViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-900">Resume Viewer</h2>
              <button 
                onClick={() => {
                  setShowPdfViewer(false);
                  setPdfUrl('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {pdfUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  title="Resume PDF Viewer"
                  onError={(e) => {
                    console.error('PDF load error');
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="mx-auto text-gray-400 mb-4" size={64} />
                    <p className="text-gray-600 mb-4">
                      Preview not available for this file type.
                    </p>
                    <a
                      href={`/api/download-resume/${pdfUrl.split('/').pop()}`}
                      download
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold inline-flex items-center gap-2"
                    >
                      <FileText size={20} /> Download File
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[300px] ${
            toast.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <p className="font-medium">{toast.message}</p>
            <button
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="ml-auto hover:opacity-80"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
