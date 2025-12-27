'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Database, FileText, Download, CheckCircle, Clock, XCircle, Eye, X, Image } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface Submission {
  id: number;
  title: string;
  data_type: string;
  description: string;
  location: string;
  date_collected: string;
  sample_count: number;
  notes: string;
  status: string;
  created_at: string;
  file_name?: string;
  file_type?: string;
  has_file?: boolean;
}

export default function SubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [fileData, setFileData] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSubmission();
    }
  }, [params.id]);

  const fetchSubmission = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/researcher/submissions/${params.id}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmission(data);
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="text-green-500" size={24} />;
      case 'rejected': return <XCircle className="text-red-500" size={24} />;
      default: return <Clock className="text-yellow-500" size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const isImageFile = (fileName?: string, fileType?: string) => {
    if (fileType?.startsWith('image/')) return true;
    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
    }
    return false;
  };

  const handleViewFile = async () => {
    if (!submission?.has_file) return;
    
    setLoadingFile(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/researcher/submissions/${params.id}/file`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        setFileData(data.file_data);
        setShowFileViewer(true);
      }
    } catch (error) {
      console.error('Error fetching file:', error);
      alert('Failed to load file');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleDownloadFile = async () => {
    if (!submission?.has_file) return;
    
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/researcher/submissions/${params.id}/file`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        const link = document.createElement('a');
        link.href = data.file_data;
        link.download = submission.file_name || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Submission Not Found</h2>
          <button
            onClick={() => router.push('/dashboard/researcher/submissions')}
            className="text-emerald-600 hover:underline"
          >
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/researcher/submissions')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Submission Details</h1>
                <p className="text-sm text-gray-600">View submission information</p>
              </div>
            </div>
            <ProfileAvatar onClick={() => router.push('/dashboard/researcher/profile')} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Banner */}
        <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${getStatusColor(submission.status)}`}>
          {getStatusIcon(submission.status)}
          <div>
            <p className="font-semibold capitalize">{submission.status}</p>
            <p className="text-sm opacity-80">
              {submission.status === 'pending' && 'This submission is awaiting review'}
              {submission.status === 'approved' && 'This submission has been approved'}
              {submission.status === 'rejected' && 'This submission was rejected'}
            </p>
          </div>
        </div>

        {/* Main Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{submission.title}</h2>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {submission.data_type}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="text-emerald-500" size={20} />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{submission.location || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="text-emerald-500" size={20} />
              <div>
                <p className="text-sm text-gray-500">Date Collected</p>
                <p className="font-medium text-gray-900">
                  {submission.date_collected 
                    ? new Date(submission.date_collected).toLocaleDateString() 
                    : 'Not specified'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Database className="text-emerald-500" size={20} />
              <div>
                <p className="text-sm text-gray-500">Sample Count</p>
                <p className="font-medium text-gray-900">{submission.sample_count || 0} samples</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="text-emerald-500" size={20} />
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="font-medium text-gray-900">
                  {new Date(submission.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {submission.description && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{submission.description}</p>
          </div>
        )}

        {/* Notes */}
        {submission.notes && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Notes</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{submission.notes}</p>
          </div>
        )}

        {/* Attached File */}
        {(submission.file_name || submission.has_file) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Attached File</h3>
            
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                {isImageFile(submission.file_name, submission.file_type) ? (
                  <Image className="text-emerald-500" size={24} />
                ) : (
                  <FileText className="text-emerald-500" size={24} />
                )}
                <div>
                  <span className="font-medium text-gray-900 block">{submission.file_name || 'Attached file'}</span>
                  {submission.file_type && (
                    <span className="text-xs text-gray-500">{submission.file_type}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleViewFile}
                  disabled={loadingFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {loadingFile ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Eye size={18} />
                  )}
                  View
                </button>
                <button 
                  onClick={handleDownloadFile}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Download size={18} />
                  Download
                </button>
              </div>
            </div>

            {/* Image Preview (if image) */}
            {isImageFile(submission.file_name, submission.file_type) && fileData && (
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <img 
                  src={fileData} 
                  alt={submission.file_name || 'Attached image'} 
                  className="max-w-full h-auto"
                />
              </div>
            )}
          </div>
        )}

        {/* File Viewer Modal */}
        {showFileViewer && fileData && (
          <div className="fixed inset-0 bg-emerald-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-[90vh] w-full bg-white rounded-xl overflow-hidden">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                <h3 className="font-semibold text-gray-900">{submission.file_name || 'File Preview'}</h3>
                <button
                  onClick={() => setShowFileViewer(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                {isImageFile(submission.file_name, submission.file_type) ? (
                  <img 
                    src={fileData} 
                    alt={submission.file_name || 'Preview'} 
                    className="max-w-full h-auto mx-auto"
                  />
                ) : submission.file_type === 'application/pdf' ? (
                  <iframe 
                    src={fileData} 
                    className="w-full h-[70vh]"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto mb-4 text-gray-300" size={64} />
                    <p className="text-gray-600 mb-4">Preview not available for this file type.</p>
                    <button 
                      onClick={handleDownloadFile}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Download to View
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/dashboard/researcher/submissions')}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back to Submissions
          </button>
          <button
            onClick={() => router.push('/dashboard/researcher/submit-data')}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            New Submission
          </button>
        </div>
      </main>
    </div>
  );
}

