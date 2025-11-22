'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Upload, FileText, Download, Trash2, User, Clock, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';

interface AssignmentFile {
  id: number;
  assignment_id: number;
  uploaded_by: number;
  uploader_role: string;
  uploader_name: string;
  uploader_email: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  file_url: string | null;
  description: string | null;
  created_at: string;
}

export default function AssignmentFilesPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  
  const [files, setFiles] = useState<AssignmentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file_name: '',
    file_type: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingFile, setViewingFile] = useState<AssignmentFile | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [fileHasData, setFileHasData] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    // Get user role from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('User role detected from localStorage:', user.role);
        setUserRole(user.role);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    } else {
      // Fallback: try to decode from token
      const token = localStorage.getItem('auth-token');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const decoded = JSON.parse(jsonPayload);
          console.log('User role decoded from token:', decoded.role);
          setUserRole(decoded.role);
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
    }
    
    fetchFiles();
  }, [assignmentId]);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/assignments/${assignmentId}/files`, { headers });
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadForm({
        ...uploadForm,
        file_name: file.name,
        file_type: file.type,
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.file_name) {
      setNotification({ type: 'error', message: 'Please select a file' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem('auth-token');
      
      // Read file as base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const response = await fetch(`/api/assignments/${assignmentId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          file_name: uploadForm.file_name,
          file_type: uploadForm.file_type,
          file_size: selectedFile.size,
          file_data: fileData, // Send base64 data
          description: uploadForm.description,
        }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'File uploaded successfully!' });
        setTimeout(() => setNotification(null), 3000);
        setShowUploadModal(false);
        setUploadForm({ file_name: '', file_type: '', description: '' });
        setSelectedFile(null);
        fetchFiles();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setNotification({ type: 'error', message: 'Failed to upload file' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewFile = async (file: AssignmentFile) => {
    setViewingFile(file);
    setShowViewModal(true);
    setFileHasData(true); // Assume true initially
    
    // Check if file has data by trying to fetch it
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/files/${file.id}/download`, {
        method: 'HEAD', // Just check headers, don't download
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        setFileHasData(false);
      }
    } catch (error) {
      setFileHasData(false);
    }
    
    await fetchComments(file.id);
  };

  const fetchComments = async (fileId: number) => {
    try {
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/files/${fileId}/comments`, { headers });
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!viewingFile || !newComment.trim()) {
      setNotification({ type: 'error', message: 'Please enter a comment' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsAddingComment(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/files/${viewingFile.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: newComment }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Comment added!' });
        setTimeout(() => setNotification(null), 2000);
        setNewComment('');
        await fetchComments(viewingFile.id);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setNotification({ type: 'error', message: 'Failed to add comment' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteClick = (fileId: number, fileName?: string) => {
    const name = fileName || files.find(f => f.id === fileId)?.file_name || 'this file';
    setFileToDelete({ id: fileId, name });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/files/${fileToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotification({ type: 'success', message: `✅ "${fileToDelete.name}" deleted successfully!` });
        setTimeout(() => setNotification(null), 3000);
        setShowDeleteModal(false);
        setFileToDelete(null);
        fetchFiles();
        if (showViewModal) {
          setShowViewModal(false);
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error: any) {
      console.error('Error deleting file:', error);
      setNotification({ type: 'error', message: error.message || 'Failed to delete file' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getRoleBadge = (role: string) => {
    if (role === 'client') {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getRoleLabel = (role: string) => {
    if (role === 'client') return 'Client';
    return 'Doctor';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assignment Files</h1>
                <p className="text-sm text-gray-600">Share files and documents</p>
              </div>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
            >
              <Upload size={20} />
              <span>Upload File</span>
            </button>
          </div>
        </div>
      </header>

    {/* Main Content */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Two-way file sharing:</strong> Both you and the {userRole === 'client' ? 'doctor' : 'client'} can upload files here. Share assignments, solutions, research papers, and any relevant documents.
        </p>
        {/* Debug info - remove after testing */}
        <p className="text-xs text-blue-600 mt-2">
          Current role: <strong>{userRole || 'Not detected'}</strong> | Delete button visible: <strong>{(userRole === 'management' || userRole === 'admin') ? 'Yes' : 'No'}</strong>
        </p>
      </div>

      {/* Files List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Files Yet</h2>
          <p className="text-gray-600 mb-6">
            Upload files to share with the {userRole === 'client' ? 'doctor' : 'client'}.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
          >
            Upload First File
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {files.map((file) => (
            <div key={file.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="bg-emerald-100 p-3 rounded-lg">
                    <FileText className="text-emerald-700" size={24} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{file.file_name}</h3>
                        <span className={`px-3 py-1 text-xs rounded-full ${getRoleBadge(file.uploader_role)}`}>
                          {getRoleLabel(file.uploader_role)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <User size={14} className="mr-1" />
                          {file.uploader_name}
                        </div>
                        <span>{formatFileSize(file.file_size)}</span>
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {new Date(file.created_at).toLocaleString()}
                        </div>
                      </div>
                      
                      {file.description && (
                        <p className="text-sm text-gray-700 mt-2">{file.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewFile(file)}
                      className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View & Comment"
                    >
                      <Eye size={18} />
                      <span className="text-sm font-medium">View</span>
                    </button>
                    <a
                      href={`/api/files/${file.id}/download`}
                      download={file.file_name}
                      className="flex items-center space-x-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Download"
                      onClick={() => {
                        setNotification({ type: 'success', message: 'Download started!' });
                        setTimeout(() => setNotification(null), 2000);
                      }}
                    >
                      <Download size={18} />
                      <span className="text-sm font-medium">Download</span>
                    </a>
                    {(userRole === 'management' || userRole === 'admin') ? (
                      <button
                        onClick={() => handleDeleteClick(file.id, file.file_name)}
                        className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200 hover:border-red-300"
                        title="Delete File"
                      >
                        <Trash2 size={18} />
                        <span className="text-sm font-medium">Delete</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Upload File</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadForm({ file_name: '', file_type: '', description: '' });
                    setSelectedFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6">
                {/* File Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File *
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                {/* File Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Name *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.file_name}
                    onChange={(e) => setUploadForm({ ...uploadForm, file_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter file name"
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Add a description or notes about this file..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadForm({ file_name: '', file_type: '', description: '' });
                      setSelectedFile(null);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || !selectedFile}
                    className="px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View & Comment Modal */}
        {showViewModal && viewingFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewingFile.file_name}</h2>
                  <p className="text-sm text-gray-600">Uploaded by {viewingFile.uploader_name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingFile(null);
                    setComments([]);
                    setNewComment('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6">
                {/* File Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">File Size:</span>
                      <span className="ml-2 text-gray-600">{formatFileSize(viewingFile.file_size)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Uploaded:</span>
                      <span className="ml-2 text-gray-600">{new Date(viewingFile.created_at).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Type:</span>
                      <span className="ml-2 text-gray-600">{viewingFile.file_type || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Role:</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${getRoleBadge(viewingFile.uploader_role)}`}>
                        {getRoleLabel(viewingFile.uploader_role)}
                      </span>
                    </div>
                  </div>
                  {viewingFile.description && (
                    <div className="mt-4">
                      <span className="font-semibold text-gray-700">Description:</span>
                      <p className="mt-1 text-gray-600">{viewingFile.description}</p>
                    </div>
                  )}
                </div>

                {/* File Preview/Reader */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Eye size={20} className="mr-2" />
                    File Preview
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-6 min-h-[400px]">
                    {viewingFile.file_type?.includes('pdf') ? (
                      <div className="w-full">
                        {fileHasData ? (
                          <>
                            <div className="h-[600px] relative">
                              {/* Primary: iframe for PDF */}
                              <iframe
                                src={`/api/files/${viewingFile.id}/download`}
                                className="w-full h-full border-0 rounded-lg bg-white shadow-inner"
                                title={viewingFile.file_name}
                                onError={(e) => {
                                  console.error('iframe failed to load PDF');
                                  setFileHasData(false);
                                }}
                              >
                                {/* Fallback for browsers that don't support iframe */}
                                <object
                                  data={`/api/files/${viewingFile.id}/download`}
                                  type="application/pdf"
                                  className="w-full h-full rounded-lg"
                                >
                                  <embed
                                    src={`/api/files/${viewingFile.id}/download`}
                                    type="application/pdf"
                                    className="w-full h-full rounded-lg"
                                  />
                                </object>
                              </iframe>
                            </div>
                            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-xs text-green-800 text-center">
                                ✅ <strong>Reading PDF online!</strong> Use the PDF controls to zoom, navigate pages, and read the document. You can also download it for offline reading.
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-8 text-center">
                            <FileText size={64} className="mx-auto mb-4 text-yellow-600" />
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">⚠️ File Needs Re-upload</h4>
                            <p className="text-gray-700 mb-4">
                              This file was uploaded before online viewing was enabled.
                            </p>
                            <div className="bg-white border border-yellow-200 rounded-lg p-4 mb-4">
                              <p className="text-sm text-gray-800 mb-3">
                                <strong>To enable online viewing:</strong>
                              </p>
                              <ol className="text-left text-sm text-gray-700 space-y-2 max-w-md mx-auto">
                                <li>1️⃣ Delete this file (if you're the doctor)</li>
                                <li>2️⃣ Upload the file again</li>
                                <li>3️⃣ It will then be viewable online! ✅</li>
                              </ol>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                              For now, you can still download and read it offline.
                            </p>
                            <a
                              href={`/api/files/${viewingFile.id}/download`}
                              download={viewingFile.file_name}
                              className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 font-semibold"
                            >
                              <Download size={20} />
                              <span>Download File</span>
                            </a>
                          </div>
                        )}
                        {/* Fallback message if nothing works */}
                        {false && (
                          <div className="bg-white rounded-lg shadow-inner p-8 text-center">
                            <FileText size={64} className="mx-auto mb-4 text-red-500" />
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">📄 PDF Document Ready</h4>
                            <p className="text-gray-600 mb-4 font-semibold">{viewingFile?.file_name}</p>
                            <p className="text-sm text-gray-700 mb-4">
                              File Size: <strong>{viewingFile ? formatFileSize(viewingFile.file_size) : 'N/A'}</strong>
                            </p>
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
                              <p className="text-sm text-gray-800 mb-4">
                                📖 <strong>To read this PDF:</strong>
                              </p>
                              <ol className="text-left text-sm text-gray-700 space-y-2 max-w-md mx-auto">
                                <li>1️⃣ Click the <strong>"Download"</strong> button below</li>
                                <li>2️⃣ Open the downloaded file on your device</li>
                                <li>3️⃣ Read the complete PDF content</li>
                              </ol>
                            </div>
                            <button
                              onClick={() => {
                                setNotification({ type: 'success', message: 'Download started!' });
                                setTimeout(() => setNotification(null), 2000);
                              }}
                              className="px-8 py-4 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                            >
                              ⬇️ Download PDF to Read
                            </button>
                          </div>
                        )}
                      </div>
                    ) : viewingFile.file_type?.includes('image') ? (
                      <div className="w-full">
                        <div className="bg-white rounded-lg shadow-inner p-4">
                          <img 
                            src={viewingFile.file_url || '/placeholder-image.png'} 
                            alt={viewingFile.file_name}
                            className="max-w-full h-auto rounded-lg"
                          />
                        </div>
                      </div>
                    ) : viewingFile.file_type?.includes('text') ? (
                      <div className="w-full">
                        <div className="bg-white rounded-lg shadow-inner p-6">
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                            {/* In real app, fetch and display text content */}
                            File content would be displayed here...
                          </pre>
                        </div>
                      </div>
                    ) : viewingFile.file_type?.includes('word') || viewingFile.file_type?.includes('document') ? (
                      <div className="w-full">
                        <div className="bg-white rounded-lg shadow-inner p-8 text-center">
                          <FileText size={64} className="mx-auto mb-4 text-blue-500" />
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">📝 Word Document</h4>
                          <p className="text-gray-600 mb-4 font-semibold">{viewingFile.file_name}</p>
                          <p className="text-sm text-gray-700 mb-4">
                            File Size: <strong>{formatFileSize(viewingFile.file_size)}</strong>
                          </p>
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
                            <p className="text-sm text-gray-800 mb-4">
                              ℹ️ <strong>Word documents cannot be viewed directly in browsers</strong>
                            </p>
                            <p className="text-sm text-gray-700 mb-4">
                              📖 <strong>To read this document:</strong>
                            </p>
                            <ol className="text-left text-sm text-gray-700 space-y-2 max-w-md mx-auto">
                              <li>1️⃣ Click the <strong>"Download"</strong> button below</li>
                              <li>2️⃣ Open in Microsoft Word, Google Docs, or LibreOffice</li>
                              <li>3️⃣ Read and edit the document with full formatting</li>
                            </ol>
                          </div>
                          <a
                            href={`/api/files/${viewingFile.id}/download`}
                            download={viewingFile.file_name}
                            className="inline-flex items-center space-x-2 px-8 py-4 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                          >
                            <Download size={20} />
                            <span>Download Document to Read</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full">
                        <div className="bg-white rounded-lg shadow-inner p-8 text-center">
                          <FileText size={64} className="mx-auto mb-4 text-gray-400" />
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">File Ready</h4>
                          <p className="text-gray-600 mb-4">{viewingFile.file_name}</p>
                          <p className="text-sm text-gray-500 mb-6">
                            Download this file to view its contents
                          </p>
                          <button
                            onClick={() => {
                              setNotification({ type: 'success', message: 'Download started!' });
                              setTimeout(() => setNotification(null), 2000);
                            }}
                            className="px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 font-semibold"
                          >
                            Download Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MessageSquare size={20} className="mr-2" />
                    Comments ({comments.length})
                  </h3>

                  {/* Comments List */}
                  <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">{comment.user_name}</span>
                              <span className={`px-2 py-1 text-xs rounded ${
                                comment.user_role === 'client' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {comment.user_role === 'client' ? 'Client' : 'Doctor'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="border-t pt-4">
                    <textarea
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 mb-3"
                      placeholder="Add a comment..."
                    />
                    <div className="flex justify-end space-x-3">
                      <a
                        href={`/api/files/${viewingFile.id}/download`}
                        download={viewingFile.file_name}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        onClick={() => {
                          setNotification({ type: 'success', message: 'Download started!' });
                          setTimeout(() => setNotification(null), 2000);
                        }}
                      >
                        <Download size={16} />
                        <span>Download</span>
                      </a>
                      <button
                        onClick={handleAddComment}
                        disabled={isAddingComment || !newComment.trim()}
                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:opacity-50"
                      >
                        <MessageSquare size={16} />
                        <span>{isAddingComment ? 'Adding...' : 'Add Comment'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && fileToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-full">
                    <Trash2 className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Delete File?</h3>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                <div className="mb-4">
                  <p className="text-gray-800 font-semibold mb-2">
                    Are you sure you want to delete this file?
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-700 font-medium break-all">
                      📄 {fileToDelete.name}
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Warning:</strong> This action cannot be undone. All comments on this file will also be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setFileToDelete(null);
                  }}
                  className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Delete File
                </button>
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
