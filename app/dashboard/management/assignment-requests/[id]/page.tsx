'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Download, DollarSign, Check, X, MessageSquare, 
  FileText, AlertCircle, Send, Eye, CheckCircle, Clock, Paperclip, Smile, Upload 
} from 'lucide-react';
import FileViewer from '@/components/FileViewer';

interface AssignmentRequest {
  id: number;
  title: string;
  subject: string;
  description: string;
  status: string;
  deadline: string | null;
  proposed_price: number | null;
  negotiated_price: number | null;
  final_price: number | null;
  currency: string;
  client_name: string;
  client_email: string;
  doctor_name: string | null;
  doctor_notes: string | null;
  negotiation_message: string | null;
  has_attachment: boolean;
  has_receipt: boolean;
  payment_method: string | null;
  created_at: string;
  price_proposed_at: string | null;
  work_filename: string | null;
  work_submitted_at: string | null;
  work_notes: string | null;
  final_submission_filename: string | null;
  final_submitted_at: string | null;
  final_submission_notes: string | null;
  client_review_status: string | null;
  client_review_notes: string | null;
}

interface Message {
  id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  message_type: string;
  created_at: string;
  has_attachment: boolean;
  attachment_filename?: string;
  attachment_type?: string;
}

export default function DoctorAssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  
  const [request, setRequest] = useState<AssignmentRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Pricing form
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'propose' | 'update' | 'verify' | null>(null);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');

  // Messaging
  const [newMessage, setNewMessage] = useState('');
  const [messageFile, setMessageFile] = useState<File | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [viewerFile, setViewerFile] = useState<{url: string; filename: string; type: string} | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Work submission
  const [workFile, setWorkFile] = useState<File | null>(null);
  const [workNotes, setWorkNotes] = useState('');
  const [uploadingWork, setUploadingWork] = useState(false);
  const workFileInputRef = useRef<HTMLInputElement>(null);

  // Final submission
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [finalNotes, setFinalNotes] = useState('');
  const [uploadingFinal, setUploadingFinal] = useState(false);
  const finalFileInputRef = useRef<HTMLInputElement>(null);

  // Professional emojis for business communication
  const professionalEmojis = ['👍', '👏', '✅', '📄', '📊', '💼', '🎯', '⭐', '🔔', '📌', '✏️', '📝', '🙏', '💡', '🚀', '⏰', '📅', '✔️'];

  useEffect(() => {
    if (params.id) {
      fetchRequest();
      fetchMessages();
      
      // Auto-refresh messages every 5 seconds
      const interval = setInterval(() => {
        fetchMessages();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [params.id]);

  // Auto-scroll to bottom only when new messages are added
  const prevMessageCountRef = useRef(messages.length);
  
  useEffect(() => {
    // Only scroll if message count increased (new message added)
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  const fetchRequest = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/assignment-requests/${params.id}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequest(data);
        
        // Pre-fill pricing form if reviewing
        if (data.status === 'pending_review' || data.status === 'negotiating') {
          setShowPricingForm(true);
          if (data.proposed_price) {
            setPrice(data.proposed_price.toString());
          }
          if (data.currency) {
            setCurrency(data.currency);
          }
          if (data.doctor_notes) {
            setNotes(data.doctor_notes);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching request:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/assignment-requests/${params.id}/messages`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // Mark messages as read when viewing
        if (data && data.length > 0) {
          fetch(`/api/assignment-requests/${params.id}/messages/mark-read`, {
            method: 'POST',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
          }).catch(err => console.error('Error marking messages as read:', err));
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleProposePrice = async () => {
    if (!price || parseFloat(price) <= 0) {
      showNotification('error', 'Please enter a valid price');
      return;
    }
    
    setConfirmAction('propose');
    setShowConfirmDialog(true);
  };

  const confirmProposePrice = async () => {
    setShowConfirmDialog(false);
    setActionLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/assignment-requests/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'propose_price',
          price: parseFloat(price),
          currency,
          notes,
        }),
      });
      
      if (response.ok) {
        showNotification('success', 'Price proposed successfully!');
        setShowPricingForm(false);
        fetchRequest();
        fetchMessages();
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to propose price');
      }
    } catch (error) {
      showNotification('error', 'Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!price || parseFloat(price) <= 0) {
      showNotification('error', 'Please enter a valid price');
      return;
    }
    
    setConfirmAction('update');
    setShowConfirmDialog(true);
  };

  const confirmUpdatePrice = async () => {
    setShowConfirmDialog(false);
    setActionLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/assignment-requests/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'update_price',
          price: parseFloat(price),
          currency,
          notes,
        }),
      });
      
      if (response.ok) {
        showNotification('success', 'Price updated successfully!');
        setShowPricingForm(false);
        fetchRequest();
        fetchMessages();
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to update price');
      }
    } catch (error) {
      showNotification('error', 'Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    setConfirmAction('verify' as any);
    setShowConfirmDialog(true);
  };

  const confirmVerifyPayment = async () => {
    setShowConfirmDialog(false);
    setActionLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/assignment-requests/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'verify_payment' }),
      });
      
      if (response.ok) {
        showNotification('success', 'Payment verified! You can now start work.');
        fetchRequest();
        fetchMessages();
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to verify payment');
      }
    } catch (error) {
      showNotification('error', 'Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadAttachment = () => {
    const token = localStorage.getItem('auth-token');
    window.open(`/api/assignment-requests/${params.id}/attachment?token=${token}`, '_blank');
  };

  const downloadReceipt = () => {
    const token = localStorage.getItem('auth-token');
    window.open(`/api/assignment-requests/${params.id}/receipt?token=${token}`, '_blank');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !messageFile) {
      showNotification('error', 'Please enter a message or attach a file');
      return;
    }

    setSendingMessage(true);
    setShowEmojiPicker(false);
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
        body: JSON.stringify({
          message: newMessage,
          attachment: attachmentData,
          filename,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setMessageFile(null);
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

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (hours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  const handleViewAttachment = (messageId: number, filename: string, fileType: string) => {
    const url = `/api/assignment-requests/${params.id}/messages/${messageId}/attachment`;
    setViewerFile({ url, filename, type: fileType });
    setShowFileViewer(true);
  };

  const handleSubmitWork = async () => {
    if (!workFile) {
      showNotification('error', 'Please select a file to upload');
      return;
    }

    console.log('[Doctor] Starting work submission...');
    console.log('[Doctor] File:', workFile.name, 'Size:', workFile.size, 'Type:', workFile.type);

    setUploadingWork(true);
    try {
      const token = localStorage.getItem('auth-token');
      console.log('[Doctor] Has token:', !!token);
      
      // Read file as base64
      console.log('[Doctor] Reading file as base64...');
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(workFile);
      });

      console.log('[Doctor] File read successfully, data length:', fileData.length);
      console.log('[Doctor] Sending to API...');

      const response = await fetch(`/api/assignment-requests/${params.id}/submit-work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fileData,
          filename: workFile.name,
          notes: workNotes,
        }),
      });

      console.log('[Doctor] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Doctor] Success:', data);
        showNotification('success', 'Work submitted successfully!');
        setWorkFile(null);
        setWorkNotes('');
        fetchRequest();
        fetchMessages();
      } else {
        const data = await response.json();
        console.error('[Doctor] Error response:', data);
        showNotification('error', data.error || 'Failed to submit work');
      }
    } catch (error: any) {
      console.error('[Doctor] Error submitting work:', error);
      console.error('[Doctor] Error message:', error.message);
      showNotification('error', 'Failed to submit work: ' + error.message);
    } finally {
      setUploadingWork(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!finalFile) {
      showNotification('error', 'Please select the final work file');
      return;
    }

    setUploadingFinal(true);
    try {
      const token = localStorage.getItem('auth-token');
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(finalFile);
      });

      const response = await fetch(`/api/assignment-requests/${params.id}/submit-final`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fileData,
          filename: finalFile.name,
          notes: finalNotes,
        }),
      });

      if (response.ok) {
        showNotification('success', 'Final work submitted for client review!');
        setFinalFile(null);
        setFinalNotes('');
        fetchRequest();
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to submit final work');
      }
    } catch (error: any) {
      showNotification('error', 'Failed to submit final work: ' + error.message);
    } finally {
      setUploadingFinal(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      price_proposed: 'bg-purple-100 text-purple-800',
      negotiating: 'bg-orange-100 text-orange-800',
      payment_pending: 'bg-indigo-100 text-indigo-800',
      payment_uploaded: 'bg-teal-100 text-teal-800',
      payment_verified: 'bg-emerald-100 text-emerald-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading request...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request Not Found</h2>
          <button
            onClick={() => router.push('/dashboard/management/assignment-requests')}
            className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  const needsAction = ['pending_review', 'negotiating', 'payment_uploaded'].includes(request.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/management/assignment-requests')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
              <p className="text-sm text-gray-600">{request.subject}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
              {request.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Action Required Banner */}
      {needsAction && (
        <div className="bg-orange-500 text-white py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center space-x-2">
              <AlertCircle size={20} />
              <span className="font-semibold">
                {request.status === 'pending_review' && 'This request needs your review and pricing'}
                {request.status === 'negotiating' && 'Client has requested price negotiation'}
                {request.status === 'payment_uploaded' && 'Payment receipt uploaded - needs verification'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Compact Client Info & Description Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Client Info - Compact */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-base font-bold text-gray-900 mb-2">Client Info</h2>
                <div className="space-y-1 text-xs">
                  <p><strong>Name:</strong> {request.client_name}</p>
                  <p><strong>Email:</strong> {request.client_email}</p>
                  <p><strong>Submitted:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
                  {request.deadline && (
                    <p><strong>Deadline:</strong> {new Date(request.deadline).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              {/* Description - Compact */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-base font-bold text-gray-900 mb-2">Description</h2>
                <p className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-4">{request.description}</p>
                {request.has_attachment && (
                  <button
                    onClick={downloadAttachment}
                    className="mt-2 flex items-center space-x-1 px-3 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700"
                  >
                    <Download size={14} />
                    <span>Attachment</span>
                  </button>
                )}
              </div>
            </div>

            {/* Pricing Form */}
            {(request.status === 'pending_review' || request.status === 'negotiating') && showPricingForm && (
              <div className="bg-white rounded-lg shadow p-6 border-2 border-emerald-500">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="mr-2 text-emerald-600" />
                  {request.status === 'negotiating' ? 'Update Price (Negotiation)' : 'Propose Price'}
                </h2>

                {request.status === 'negotiating' && request.negotiation_message && (
                  <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm font-semibold text-orange-900 mb-2">Client's Negotiation Request:</p>
                    <p className="text-sm text-orange-800">{request.negotiation_message}</p>
                    {request.negotiated_price && (
                      <p className="text-sm text-orange-800 mt-2">
                        <strong>Counter Offer:</strong> ${request.negotiated_price}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Amount *
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g., 50"
                        min="0"
                        step="0.01"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="USD">USD</option>
                        <option value="LRD">LRD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes for Client (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Explain the pricing, what's included, timeline, etc..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    onClick={request.status === 'negotiating' ? handleUpdatePrice : handleProposePrice}
                    disabled={actionLoading}
                    className="w-full px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 font-semibold"
                  >
                    {actionLoading ? 'Submitting...' : 
                     request.status === 'negotiating' ? 'Update Price' : 'Propose Price'}
                  </button>
                </div>
              </div>
            )}

            {/* Price & Payment Status - Side by Side Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Current Price Display */}
              {request.proposed_price && !showPricingForm && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center">
                    <DollarSign className="mr-1 text-purple-600" size={18} />
                    Proposed Price
                  </h2>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-700">Amount:</span>
                      <span className="text-xl font-bold text-purple-700">
                        {request.currency} ${request.final_price || request.proposed_price}
                      </span>
                    </div>
                    {request.doctor_notes && (
                      <div className="mt-2 pt-2 border-t border-purple-200">
                        <p className="text-xs text-gray-700 line-clamp-2">
                          <strong>Note:</strong> {request.doctor_notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {request.status === 'negotiating' && (
                    <button
                      onClick={() => setShowPricingForm(true)}
                      className="mt-3 w-full px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                    >
                      Update Price
                    </button>
                  )}
                </div>
              )}

              {/* Payment Verified Status */}
              {['payment_verified', 'in_progress', 'completed'].includes(request.status) && (
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="text-green-600" size={20} />
                      <span className="font-semibold text-green-900 text-sm">Payment Verified</span>
                    </div>
                    <p className="text-xs text-green-700">
                      Payment confirmed. You can now work on this assignment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Verification - Full Width when needed */}
            {request.status === 'payment_uploaded' && (
              <div className="bg-white rounded-lg shadow p-4 border-2 border-teal-500">
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="mr-1 text-teal-600" size={18} />
                  Verify Payment
                </h2>
                
                <div className="bg-teal-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-teal-900 mb-1">
                    <strong>Method:</strong> {request.payment_method?.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-xs text-teal-900 mb-1">
                    <strong>Amount:</strong> {request.currency} ${request.final_price}
                  </p>
                  <p className="text-xs text-teal-700">
                    Client uploaded receipt. Verify before starting work.
                  </p>
                </div>

                {request.has_receipt && (
                  <button
                    onClick={downloadReceipt}
                    className="w-full mb-3 flex items-center justify-center space-x-2 px-3 py-2 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
                  >
                    <Download size={16} />
                    <span>Download Receipt</span>
                  </button>
                )}

                <button
                  onClick={handleVerifyPayment}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 font-semibold"
                >
                  {actionLoading ? 'Verifying...' : '✓ Confirm Payment'}
                </button>
              </div>
            )}

            {/* Work Submission Sections - Side by Side Grid */}
            {['payment_verified', 'in_progress', 'revision_requested'].includes(request.status) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Work Submission Section - Compact */}
                <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center">
                  <Upload className="mr-1 text-emerald-600" size={18} />
                  Submit Work to Client
                </h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                  <p className="text-xs text-blue-800">
                    💡 Upload partial work for client review
                  </p>
                </div>

                {request.work_filename && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-emerald-900 mb-1">Previously Submitted:</p>
                    <p className="text-xs text-emerald-700 truncate mb-2">{request.work_filename}</p>
                    {request.work_submitted_at && (
                      <p className="text-xs text-emerald-600 mb-2">
                        {new Date(request.work_submitted_at).toLocaleDateString()}
                      </p>
                    )}
                    <a
                      href={`/api/assignment-requests/${params.id}/submit-work?token=${localStorage.getItem('auth-token')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 w-full"
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </a>
                  </div>
                )}

                <div className="space-y-3">
                  {/* File Selection - Compact */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">File</label>
                    <input
                      ref={workFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.zip,.rar"
                      onChange={(e) => setWorkFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => workFileInputRef.current?.click()}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded hover:border-emerald-500 hover:bg-emerald-50 text-sm"
                    >
                      <Upload size={16} className="text-gray-500" />
                      <span className="text-gray-600 truncate">
                        {workFile ? workFile.name : 'Select file'}
                      </span>
                    </button>
                    {workFile && (
                      <button
                        onClick={() => setWorkFile(null)}
                        className="mt-1 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Notes - Compact */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                      value={workNotes}
                      onChange={(e) => setWorkNotes(e.target.value)}
                      placeholder="Add notes..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  {/* Submit Button - Compact */}
                  <button
                    onClick={handleSubmitWork}
                    disabled={!workFile || uploadingWork}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 text-sm font-semibold"
                  >
                    <Upload size={16} />
                    <span>{uploadingWork ? 'Uploading...' : 'Submit Work'}</span>
                  </button>
                </div>
                </div>

                {/* Final Submission Section - Compact */}
                <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="mr-1 text-green-600" size={18} />
                  Submit Final Work
                </h3>
                
                <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
                  <p className="text-xs text-green-800">
                    🎯 Upload completed work for client review
                  </p>
                </div>

                {request.final_submission_filename && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-blue-900 mb-1">Previously Submitted:</p>
                    <p className="text-xs text-blue-700 truncate mb-2">{request.final_submission_filename}</p>
                    {request.final_submitted_at && (
                      <p className="text-xs text-blue-600 mb-2">
                        {new Date(request.final_submitted_at).toLocaleDateString()}
                      </p>
                    )}
                    {request.client_review_status && (
                      <div className="mb-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          request.client_review_status === 'accepted' ? 'bg-green-100 text-green-800' :
                          request.client_review_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.client_review_status === 'accepted' ? '✅ Accepted' :
                           request.client_review_status === 'rejected' ? '❌ Rejected' :
                           '⏳ Pending Review'}
                        </span>
                        {request.client_review_notes && (
                          <p className="text-xs text-gray-700 mt-2 bg-white p-2 rounded">
                            <strong>Feedback:</strong> {request.client_review_notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Final Work File</label>
                    <input
                      ref={finalFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.zip,.rar"
                      onChange={(e) => setFinalFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => finalFileInputRef.current?.click()}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded hover:border-green-500 hover:bg-green-50 text-sm"
                    >
                      <Upload size={16} className="text-gray-500" />
                      <span className="text-gray-600 truncate">
                        {finalFile ? finalFile.name : 'Select final file'}
                      </span>
                    </button>
                    {finalFile && (
                      <button
                        onClick={() => setFinalFile(null)}
                        className="mt-1 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Final Notes</label>
                    <textarea
                      value={finalNotes}
                      onChange={(e) => setFinalNotes(e.target.value)}
                      placeholder="Add final notes..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <button
                    onClick={handleSubmitFinal}
                    disabled={!finalFile || uploadingFinal}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-semibold"
                  >
                    <CheckCircle size={16} />
                    <span>{uploadingFinal ? 'Submitting...' : 'Submit Final Work'}</span>
                  </button>
                </div>
                </div>
              </div>
            )}

            {/* Messages/Communication - WhatsApp Style */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <MessageSquare className="mr-2" size={24} />
                  Communication with Client
                </h2>
                <p className="text-emerald-100 text-sm mt-1">Messages update automatically</p>
              </div>

              {/* Messages List */}
              <div className="bg-gray-50 p-4 h-96 overflow-y-auto" style={{backgroundImage: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%)'}}>
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-500">No messages yet</p>
                      <p className="text-gray-400 text-sm">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex mb-4 ${
                        msg.sender_role === 'management' || msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'
                      }`}>
                        <div className={`max-w-[75%] ${
                          msg.sender_role === 'management' || msg.sender_role === 'admin'
                            ? 'bg-emerald-500 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl' 
                            : 'bg-white text-gray-900 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl shadow-sm'
                        } px-4 py-3`}>
                          {msg.sender_role !== 'management' && msg.sender_role !== 'admin' && (
                            <p className="text-xs font-semibold text-blue-600 mb-1">{msg.sender_name}</p>
                          )}
                          {msg.message && (
                            <p className={`text-sm whitespace-pre-wrap break-words ${
                              msg.sender_role === 'management' || msg.sender_role === 'admin' ? 'text-white' : 'text-gray-800'
                            }`}>{msg.message}</p>
                          )}
                          {msg.has_attachment && (
                            <button
                              onClick={() => handleViewAttachment(msg.id, msg.attachment_filename || 'file', msg.attachment_type || '')}
                              className={`flex items-center space-x-2 mt-2 px-3 py-2 rounded-lg text-sm ${
                                msg.sender_role === 'management' || msg.sender_role === 'admin'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              <Paperclip size={14} />
                              <span className="font-medium">{msg.attachment_filename}</span>
                              <Download size={12} />
                            </button>
                          )}
                          <p className={`text-xs mt-1 ${
                            msg.sender_role === 'management' || msg.sender_role === 'admin' ? 'text-emerald-100' : 'text-gray-500'
                          }`}>
                            {formatMessageTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input - WhatsApp Style */}
              <div className="bg-white border-t p-4">
                {messageFile && (
                  <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 rounded-lg mb-3 border border-emerald-200">
                    <Paperclip size={16} className="text-emerald-600" />
                    <span className="text-sm flex-1 text-gray-700 font-medium">{messageFile.name}</span>
                    <button
                      onClick={() => setMessageFile(null)}
                      className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="mb-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-xs text-gray-600 mb-2 font-semibold">Professional Emojis</p>
                    <div className="grid grid-cols-9 gap-2">
                      {professionalEmojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => insertEmoji(emoji)}
                          className="text-2xl hover:bg-gray-100 rounded p-2 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-end space-x-2">
                  <input
                    ref={messageFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    onChange={(e) => setMessageFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  
                  {/* Emoji Button */}
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Add emoji"
                  >
                    <Smile size={22} />
                  </button>

                  {/* Attach Button */}
                  <button
                    onClick={() => messageFileInputRef.current?.click()}
                    className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Attach file"
                  >
                    <Paperclip size={22} />
                  </button>

                  {/* Message Input */}
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      style={{minHeight: '48px', maxHeight: '120px'}}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || (!newMessage.trim() && !messageFile)}
                    className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Send message"
                  >
                    <Send size={22} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">Press Enter to send, Shift+Enter for new line</p>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {request.status === 'pending_review' && (
                  <button
                    onClick={() => setShowPricingForm(true)}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                  >
                    Review & Price
                  </button>
                )}
                
                {request.status === 'negotiating' && (
                  <button
                    onClick={() => setShowPricingForm(true)}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    Respond to Negotiation
                  </button>
                )}
                
                {request.status === 'payment_uploaded' && (
                  <button
                    onClick={handleVerifyPayment}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Verify Payment
                  </button>
                )}

                {request.has_attachment && (
                  <button
                    onClick={downloadAttachment}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Download Attachment
                  </button>
                )}

                {request.has_receipt && (
                  <button
                    onClick={downloadReceipt}
                    className="w-full px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                  >
                    View Receipt
                  </button>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">Status Timeline</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span>Request Submitted</span>
                </div>
                {request.price_proposed_at && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span>Price Proposed</span>
                  </div>
                )}
                {['payment_pending', 'payment_uploaded', 'payment_verified', 'in_progress', 'completed'].includes(request.status) && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span>Price Accepted</span>
                  </div>
                )}
                {['payment_uploaded', 'payment_verified', 'in_progress', 'completed'].includes(request.status) && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span>Payment Uploaded</span>
                  </div>
                )}
                {['payment_verified', 'in_progress', 'completed'].includes(request.status) && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span>Payment Verified</span>
                  </div>
                )}
                {request.status === 'in_progress' && (
                  <div className="flex items-center space-x-2">
                    <Clock className="text-blue-500 animate-pulse" size={16} />
                    <span>Work In Progress</span>
                  </div>
                )}
                {request.status === 'completed' && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span>Completed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Tips</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Review the description carefully before pricing</li>
                <li>• Download attachments to understand requirements</li>
                <li>• Be fair and transparent with pricing</li>
                <li>• Verify payment receipts thoroughly</li>
                <li>• Communicate clearly with the client</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Styled Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full p-2">
                  <DollarSign className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {confirmAction === 'propose' ? 'Confirm Price Proposal' : 
                   confirmAction === 'update' ? 'Confirm Price Update' : 
                   'Confirm Payment Verification'}
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {confirmAction === 'verify' ? (
                <>
                  <p className="text-gray-700 text-lg mb-4">
                    Have you verified the payment receipt and confirmed the transaction?
                  </p>
                  
                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="text-green-600" size={20} />
                      <span className="text-green-900 font-semibold">Payment Amount:</span>
                    </div>
                    <p className="text-3xl font-bold text-green-700">
                      {request?.currency} ${request?.final_price}
                    </p>
                    <p className="text-sm text-green-700 mt-2">
                      Method: {request?.payment_method?.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <p className="text-xs text-orange-800">
                      ⚠️ Only confirm if you have verified the payment receipt and the transaction is valid.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-700 text-lg mb-4">
                    {confirmAction === 'propose' 
                      ? 'Are you sure you want to propose this price to the client?'
                      : 'Are you sure you want to update the price?'}
                  </p>
                  
                  <div className="bg-emerald-50 rounded-lg p-4 border-2 border-emerald-200 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-900 font-semibold">Price Amount:</span>
                      <span className="text-3xl font-bold text-emerald-700">
                        {currency} ${price}
                      </span>
                    </div>
                    {notes && (
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <p className="text-sm text-emerald-800">
                          <strong>Note:</strong> {notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-800">
                      💡 The client will be notified and can accept, negotiate, or reject this price.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={
                  confirmAction === 'propose' ? confirmProposePrice : 
                  confirmAction === 'update' ? confirmUpdatePrice : 
                  confirmVerifyPayment
                }
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 font-semibold shadow-lg disabled:opacity-50 transition-all"
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>

      {/* File Viewer Modal */}
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
