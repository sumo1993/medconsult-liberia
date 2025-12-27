'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Download, MessageSquare, FileText, Send, Clock, 
  CheckCircle, Paperclip, Smile, Upload, Calendar, DollarSign, User, X
} from 'lucide-react';
import FileViewer from '@/components/FileViewer';

interface Assignment {
  id: number;
  title: string;
  subject: string;
  description: string;
  status: string;
  deadline: string | null;
  final_price: number | null;
  currency: string;
  client_name: string;
  client_email: string;
  created_at: string;
  assigned_at: string | null;
  work_filename: string | null;
  work_submitted_at: string | null;
  has_attachment: boolean;
}

interface Message {
  id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
  has_attachment: boolean;
  attachment_filename?: string;
  attachment_type?: string;
}

export default function ConsultantAssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Messaging
  const [newMessage, setNewMessage] = useState('');
  const [messageFile, setMessageFile] = useState<File | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Work submission
  const [workFile, setWorkFile] = useState<File | null>(null);
  const [workNotes, setWorkNotes] = useState('');
  const [uploadingWork, setUploadingWork] = useState(false);
  const workFileInputRef = useRef<HTMLInputElement>(null);

  // File viewer
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [viewerFile, setViewerFile] = useState<{url: string; filename: string; type: string} | null>(null);

  const professionalEmojis = ['👍', '👏', '✅', '📄', '📊', '💼', '🎯', '⭐', '🔔', '📌', '✏️', '📝', '🙏', '💡', '🚀', '⏰', '📅', '✔️'];

  useEffect(() => {
    if (params.id) {
      fetchAssignment();
      fetchMessages();
      
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [params.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAssignment = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/assignment-requests/${params.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setAssignment(data);
      } else {
        showNotification('error', 'Failed to load assignment');
      }
    } catch (error) {
      showNotification('error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/assignment-requests/${params.id}/messages`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !messageFile) {
      showNotification('error', 'Please enter a message or attach a file');
      return;
    }

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('auth-token');
      let attachmentData = null;
      let filename = null;

      if (messageFile) {
        const reader = new FileReader();
        attachmentData = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(messageFile);
        });
        filename = messageFile.name;
      }

      const response = await fetch(`/api/assignment-requests/${params.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: newMessage, attachment: attachmentData, filename }),
      });

      if (response.ok) {
        setNewMessage('');
        setMessageFile(null);
        setShowEmojiPicker(false);
        fetchMessages();
        showNotification('success', 'Message sent!');
      } else {
        showNotification('error', 'Failed to send message');
      }
    } catch (error) {
      showNotification('error', 'Network error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!workFile) {
      showNotification('error', 'Please select a file to upload');
      return;
    }

    setUploadingWork(true);
    try {
      const token = localStorage.getItem('auth-token');
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(workFile);
      });

      const response = await fetch(`/api/assignment-requests/${params.id}/submit-work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fileData, filename: workFile.name, notes: workNotes }),
      });

      if (response.ok) {
        showNotification('success', 'Work submitted successfully!');
        setWorkFile(null);
        setWorkNotes('');
        fetchAssignment();
        fetchMessages();
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to submit work');
      }
    } catch (error: any) {
      showNotification('error', 'Failed to submit work: ' + error.message);
    } finally {
      setUploadingWork(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'work_submitted': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Assignment not found or you don't have access.</p>
          <button
            onClick={() => router.push('/dashboard/consultant/assignments')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/consultant/assignments')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{assignment.title}</h1>
              <p className="text-sm text-gray-600">{assignment.subject}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
              {assignment.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Assignment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignment Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Assignment Details</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <User className="text-gray-400" size={18} />
                  <span className="text-gray-600">Client:</span>
                  <span className="font-medium">{assignment.client_name}</span>
                </div>
                {assignment.deadline && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="text-gray-400" size={18} />
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-medium">{formatDate(assignment.deadline)}</span>
                  </div>
                )}
                {assignment.final_price && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="text-gray-400" size={18} />
                    <span className="text-gray-600">Payment:</span>
                    <span className="font-medium">{assignment.currency} {assignment.final_price.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="text-gray-400" size={18} />
                  <span className="text-gray-600">Assigned:</span>
                  <span className="font-medium">{assignment.assigned_at ? formatDate(assignment.assigned_at) : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Work Submission */}
            {['assigned', 'in_progress'].includes(assignment.status) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="text-emerald-600" size={20} />
                  Submit Your Work
                </h3>

                <div className="space-y-4">
                  <div>
                    <input
                      ref={workFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.zip,.rar"
                      onChange={(e) => setWorkFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => workFileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50"
                    >
                      <Upload className="text-gray-500" size={20} />
                      <span className="text-gray-600">
                        {workFile ? workFile.name : 'Select file to upload'}
                      </span>
                    </button>
                  </div>

                  <textarea
                    value={workNotes}
                    onChange={(e) => setWorkNotes(e.target.value)}
                    placeholder="Add notes about your work..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />

                  <button
                    onClick={handleSubmitWork}
                    disabled={!workFile || uploadingWork}
                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
                  >
                    {uploadingWork ? 'Uploading...' : 'Submit Work'}
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare size={20} />
                  Communication
                </h2>
              </div>

              <div className="bg-gray-50 p-4 h-80 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No messages yet</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex mb-4 ${
                        msg.sender_role === 'consultant' ? 'justify-end' : 'justify-start'
                      }`}>
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                          msg.sender_role === 'consultant'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white shadow-sm text-gray-900'
                        }`}>
                          {msg.sender_role !== 'consultant' && (
                            <p className="text-xs font-semibold text-emerald-600 mb-1">{msg.sender_name}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_role === 'consultant' ? 'text-emerald-100' : 'text-gray-500'
                          }`}>
                            {formatDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t p-4">
                {messageFile && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg mb-3">
                    <Paperclip className="text-emerald-600" size={16} />
                    <span className="text-sm flex-1">{messageFile.name}</span>
                    <button onClick={() => setMessageFile(null)} className="text-red-600">
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <input
                    ref={messageFileInputRef}
                    type="file"
                    onChange={(e) => setMessageFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    onClick={() => messageFileInputRef.current?.click()}
                    className="p-3 text-gray-600 hover:bg-gray-100 rounded-full"
                  >
                    <Paperclip size={20} />
                  </button>
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || (!newMessage.trim() && !messageFile)}
                    className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">Status</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className={assignment.status !== 'assigned' ? 'text-green-500' : 'text-gray-300'} size={20} />
                  <span className={assignment.status !== 'assigned' ? 'text-gray-900' : 'text-gray-500'}>Assigned</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={assignment.status === 'in_progress' || assignment.status === 'work_submitted' || assignment.status === 'completed' ? 'text-green-500' : 'text-gray-300'} size={20} />
                  <span className={assignment.status === 'in_progress' || assignment.status === 'work_submitted' || assignment.status === 'completed' ? 'text-gray-900' : 'text-gray-500'}>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={assignment.status === 'work_submitted' || assignment.status === 'completed' ? 'text-green-500' : 'text-gray-300'} size={20} />
                  <span className={assignment.status === 'work_submitted' || assignment.status === 'completed' ? 'text-gray-900' : 'text-gray-500'}>Work Submitted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={assignment.status === 'completed' ? 'text-green-500' : 'text-gray-300'} size={20} />
                  <span className={assignment.status === 'completed' ? 'text-gray-900' : 'text-gray-500'}>Completed</span>
                </div>
              </div>
            </div>

            {assignment.has_attachment && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-gray-900 mb-4">Client Attachment</h3>
                <button
                  onClick={() => {
                    const token = localStorage.getItem('auth-token');
                    window.open(`/api/assignment-requests/${params.id}/attachment?token=${token}`, '_blank');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* File Viewer */}
      {showFileViewer && viewerFile && (
        <FileViewer
          fileUrl={viewerFile.url}
          filename={viewerFile.filename}
          fileType={viewerFile.type}
          onClose={() => setShowFileViewer(false)}
        />
      )}
    </div>
  );
}

