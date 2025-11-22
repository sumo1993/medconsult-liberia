'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Download, DollarSign, Check, X, MessageSquare, 
  Upload, FileText, Clock, CheckCircle, AlertCircle, Send, Paperclip, Smile, Star
} from 'lucide-react';
import FileViewer from '@/components/FileViewer';
import { RatingForm } from '@/components/RatingStars';

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
  doctor_email: string | null;
  doctor_notes: string | null;
  negotiation_message: string | null;
  rejection_reason: string | null;
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

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [request, setRequest] = useState<AssignmentRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Negotiation form
  const [showNegotiationForm, setShowNegotiationForm] = useState(false);
  const [negotiationMessage, setNegotiationMessage] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  
  // Rejection form
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  // Confirmation dialog
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);

  // Messaging
  const [newMessage, setNewMessage] = useState('');
  const [messageFile, setMessageFile] = useState<File | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [viewerFile, setViewerFile] = useState<{url: string; filename: string; type: string} | null>(null);

  // Final work review
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewAction, setReviewAction] = useState<'accept' | 'reject'>('accept');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Rating
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);
  const [loadingRating, setLoadingRating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Professional emojis for business communication
  const professionalEmojis = ['👍', '👏', '✅', '📄', '📊', '💼', '🎯', '⭐', '🔔', '📌', '✏️', '📝', '🙏', '💡', '🚀', '⏰', '📅', '✔️'];

  useEffect(() => {
    if (params.id && params.id !== 'new') {
      fetchRequest();
      fetchMessages();
      fetchRating();
      
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
    // Don't fetch for 'new' page
    if (params.id === 'new') return;
    
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
      }
    } catch (error) {
      console.error('Error fetching request:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    // Don't fetch for 'new' page
    if (params.id === 'new') return;
    
    try {
      const token = localStorage.getItem('auth-token');
      console.log('[Client] Fetching messages for assignment:', params.id);
      
      const response = await fetch(`/api/assignment-requests/${params.id}/messages`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      console.log('[Client] Messages response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Client] Messages data received:', data);
        console.log('[Client] Number of messages:', data.length);
        
        // API returns array directly, not wrapped in object
        setMessages(data || []);
        
        // Mark messages as read when viewing
        if (data && data.length > 0) {
          fetch(`/api/assignment-requests/${params.id}/messages/mark-read`, {
            method: 'POST',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
          }).catch(err => console.error('Error marking messages as read:', err));
        }
      } else {
        // Handle error response
        try {
          const errorData = await response.json();
          console.error('[Client] Error fetching messages:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
        } catch (e) {
          console.error('[Client] Error fetching messages (non-JSON response):', {
            status: response.status,
            statusText: response.statusText
          });
        }
        // Set empty messages array on error
        setMessages([]);
      }
    } catch (error) {
      console.error('[Client] Error fetching messages (exception):', error);
      setMessages([]);
    }
  };

  const handleAcceptPrice = async () => {
    setShowAcceptDialog(true);
  };

  const confirmAcceptPrice = async () => {
    setShowAcceptDialog(false);
    setActionLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/assignment-requests/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'accept_price' }),
      });
      
      if (response.ok) {
        showNotification('success', 'Price accepted! Please proceed to payment.');
        fetchRequest();
        fetchMessages();
        setShowPaymentForm(true);
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to accept price');
      }
    } catch (error) {
      showNotification('error', 'Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReduction = async () => {
    if (!negotiationMessage.trim()) {
      showNotification('error', 'Please enter a message');
      return;
    }
    
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
          action: 'request_reduction',
          message: negotiationMessage,
          counter_price: counterPrice ? parseFloat(counterPrice) : null,
        }),
      });
      
      if (response.ok) {
        showNotification('success', 'Negotiation request sent!');
        setShowNegotiationForm(false);
        setNegotiationMessage('');
        setCounterPrice('');
        fetchRequest();
        fetchMessages();
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to send request');
      }
    } catch (error) {
      showNotification('error', 'Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPrice = async () => {
    if (!rejectionReason.trim()) {
      showNotification('error', 'Please enter a reason');
      return;
    }
    
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
          action: 'reject_price',
          reason: rejectionReason,
        }),
      });
      
      if (response.ok) {
        showNotification('success', 'Request rejected and closed.');
        setShowRejectionForm(false);
        fetchRequest();
        fetchMessages();
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to reject');
      }
    } catch (error) {
      showNotification('error', 'Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewAction === 'reject' && !reviewNotes.trim()) {
      showNotification('error', 'Please provide feedback for rejection');
      return;
    }

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/assignment-requests/${params.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: reviewAction,
          notes: reviewNotes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showNotification('success', data.message);
        setShowReviewForm(false);
        setReviewNotes('');
        fetchRequest();
        
        // If accepted, show rating form
        if (reviewAction === 'accept') {
          setShowRatingForm(true);
        }
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to submit review');
      }
    } catch (error) {
      showNotification('error', 'Network error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const fetchRating = async () => {
    // Don't fetch for 'new' page
    if (params.id === 'new') return;
    
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/ratings?assignmentId=${params.id}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExistingRating(data.rating);
      }
    } catch (error) {
      console.error('Failed to fetch rating:', error);
    }
  };

  const handleSubmitRating = async (rating: number, review: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          assignmentId: params.id,
          rating,
          review,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showNotification('success', 'Rating submitted successfully! Thank you for your feedback.');
        setShowRatingForm(false);
        fetchRating();
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to submit rating');
      }
    } catch (error) {
      showNotification('error', 'Network error');
    }
  };

  const handleUploadPayment = async () => {
    if (!receiptFile) {
      showNotification('error', 'Please select a receipt file');
      return;
    }
    
    setActionLoading(true);
    try {
      const reader = new FileReader();
      const receipt_data = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(receiptFile);
      });
      
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/assignment-requests/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'upload_payment',
          payment_method: paymentMethod,
          receipt_data,
          receipt_filename: receiptFile.name,
        }),
      });
      
      if (response.ok) {
        showNotification('success', 'Payment receipt uploaded! Waiting for verification.');
        setShowPaymentForm(false);
        setReceiptFile(null);
        fetchRequest();
        fetchMessages();
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to upload receipt');
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

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      price_proposed: 'bg-purple-100 text-purple-800',
      negotiating: 'bg-orange-100 text-orange-800',
      payment_pending: 'bg-indigo-100 text-indigo-800',
      payment_uploaded: 'bg-teal-100 text-teal-800',
      payment_verified: 'bg-emerald-100 text-emerald-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
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
            onClick={() => router.push('/dashboard/client/assignments')}
            className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
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
              onClick={() => router.push('/dashboard/client/assignments')}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Compact Description & Price Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Description - Compact */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-base font-bold text-gray-900 mb-2">Description</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">{request.description}</p>
                
                <div className="mt-3 flex items-center justify-between text-xs">
                  {request.deadline && (
                    <span className="text-gray-600">
                      📅 {new Date(request.deadline).toLocaleDateString()}
                    </span>
                  )}
                  
                  {request.has_attachment && (
                    <button
                      onClick={downloadAttachment}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      <Download size={14} />
                      <span>Attachment</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Price Proposal - Compact */}
              {request.proposed_price && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center">
                    <DollarSign className="mr-1 text-purple-600" size={18} />
                    Price Proposal
                  </h2>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700">Amount:</span>
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
                </div>
              )}
            </div>

            {/* Price Action Buttons - Compact Grid */}
            {request.proposed_price && request.status === 'price_proposed' && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleAcceptPrice}
                    disabled={actionLoading}
                    className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    <Check size={16} />
                    <span>Accept</span>
                  </button>
                  
                  <button
                    onClick={() => setShowNegotiationForm(!showNegotiationForm)}
                    className="flex items-center justify-center space-x-1 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
                  >
                    <MessageSquare size={16} />
                    <span>Negotiate</span>
                  </button>
                  
                  <button
                    onClick={() => setShowRejectionForm(!showRejectionForm)}
                    className="flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    <X size={16} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            )}

            {/* Negotiation Form */}
            {showNegotiationForm && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-orange-900 mb-3">Request Price Reduction</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Counter Offer (Optional)
                        </label>
                        <input
                          type="number"
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                          placeholder="e.g., 40"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Message *
                        </label>
                        <textarea
                          value={negotiationMessage}
                          onChange={(e) => setNegotiationMessage(e.target.value)}
                          rows={3}
                          placeholder="Explain why you're requesting a reduction..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <button
                        onClick={handleRequestReduction}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                      >
                        {actionLoading ? 'Sending...' : 'Send Request'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Rejection Form */}
                {showRejectionForm && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h3 className="font-semibold text-red-900 mb-3">Reject Request</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason for Rejection *
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                          placeholder="Why are you rejecting this request?"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <button
                        onClick={handleRejectPrice}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </div>
                )}

            {/* Work Status & Submission - Compact Grid Layout */}
            {(request.status === 'payment_verified' || request.status === 'in_progress') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Work In Progress - Compact */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-300">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="bg-blue-500 rounded-full p-2">
                      <FileText className="text-white" size={20} />
                    </div>
                    <span className="font-bold text-blue-900">Work In Progress</span>
                  </div>
                  <p className="text-sm text-blue-800 mb-2">
                    Payment confirmed. In process.
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-gray-700">
                      <strong className="text-blue-900">What's happening:</strong><br/>
                      • Your consultant is actively working on your assignment<br/>
                      • You'll be notified when the work is completed<br/>
                      • You can check back here for updates
                    </p>
                  </div>
                </div>

                {/* Submitted Work - Compact */}
                {request.work_filename ? (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="bg-emerald-500 rounded-full p-2">
                        <FileText className="text-white" size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-emerald-900">Submitted Work</h3>
                        <p className="text-xs text-emerald-700">Work available for review</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 mb-3">
                      <div className="mb-2">
                        <p className="text-xs text-gray-600">File Name:</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{request.work_filename}</p>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Submitted:</span>
                        <span className="font-medium text-gray-700">
                          {request.work_submitted_at && new Date(request.work_submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      {request.work_notes && (
                        <div className="border-t pt-2 mt-2">
                          <p className="text-xs text-gray-600 mb-1">Notes:</p>
                          <p className="text-xs text-gray-800 bg-gray-50 p-2 rounded">{request.work_notes}</p>
                        </div>
                      )}
                    </div>

                    <a
                      href={`/api/assignment-requests/${params.id}/submit-work?token=${localStorage.getItem('auth-token')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm transition-all"
                    >
                      <Download size={16} />
                      <span>Download & Review Work</span>
                    </a>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-600 font-medium">No work submitted yet</p>
                      <p className="text-xs text-gray-500 mt-1">Check back later for updates</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Final Submission Review Section */}
            {request.final_submission_filename && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="mr-2 text-green-600" />
                  Final Completed Work - Review Required
                </h2>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-green-500 rounded-full p-3">
                      <FileText className="text-white" size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-green-900 text-lg">Final Work Ready for Review</h3>
                      <p className="text-sm text-green-700">Your consultant has completed the work</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-600">File Name:</p>
                        <p className="font-semibold text-gray-900">{request.final_submission_filename}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Submitted:</p>
                        <p className="text-sm font-medium text-gray-700">
                          {request.final_submitted_at && new Date(request.final_submitted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {request.final_submission_notes && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-sm text-gray-600 mb-1">Consultant's Notes:</p>
                        <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md">{request.final_submission_notes}</p>
                      </div>
                    )}
                  </div>

                  <a
                    href={`/api/assignment-requests/${params.id}/submit-final?token=${localStorage.getItem('auth-token')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all mb-4"
                  >
                    <Download size={20} />
                    <span>Download & Review Final Work</span>
                  </a>

                  {request.client_review_status === 'pending' && !showReviewForm && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setReviewAction('accept');
                          setShowReviewForm(true);
                        }}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                      >
                        <Check size={20} />
                        <span>Accept Work</span>
                      </button>
                      <button
                        onClick={() => {
                          setReviewAction('reject');
                          setShowReviewForm(true);
                        }}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                      >
                        <X size={20} />
                        <span>Request Revision</span>
                      </button>
                    </div>
                  )}

                  {showReviewForm && (
                    <div className="mt-4 p-4 bg-white rounded-lg border-2 border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {reviewAction === 'accept' ? '✅ Accept Final Work' : '🔄 Request Revision'}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {reviewAction === 'accept' ? 'Feedback (Optional)' : 'What needs to be revised? *'}
                          </label>
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder={reviewAction === 'accept' ? 'Add any comments...' : 'Please explain what needs to be changed...'}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSubmitReview}
                            disabled={submittingReview}
                            className={`flex-1 px-4 py-2 ${reviewAction === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'} text-white rounded-md font-semibold disabled:opacity-50`}
                          >
                            {submittingReview ? 'Submitting...' : reviewAction === 'accept' ? 'Confirm Accept' : 'Send for Revision'}
                          </button>
                          <button
                            onClick={() => {
                              setShowReviewForm(false);
                              setReviewNotes('');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {request.client_review_status === 'accepted' && (
                    <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                      <p className="text-green-800 font-semibold">✅ Work Accepted - Assignment Completed!</p>
                    </div>
                  )}

                  {request.client_review_status === 'rejected' && (
                    <div className="mt-4 p-4 bg-orange-100 border border-orange-300 rounded-lg">
                      <p className="text-orange-800 font-semibold">🔄 Revision Requested - Waiting for doctor to resubmit</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Section */}
            {(request.status === 'payment_pending' || request.status === 'payment_uploaded') && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Upload className="mr-2 text-indigo-600" />
                  Payment
                </h2>

                {request.status === 'payment_pending' && (
                  <>
                    <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-indigo-900 mb-2">
                        <strong>Amount to Pay:</strong> {request.currency} ${request.final_price}
                      </p>
                      <p className="text-xs text-indigo-700">
                        Please make payment and upload your receipt below
                      </p>
                    </div>

                    {!showPaymentForm && (
                      <button
                        onClick={() => setShowPaymentForm(true)}
                        className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Upload Payment Receipt
                      </button>
                    )}

                    {showPaymentForm && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Method
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="mobile_money">Mobile Money (MTN, Orange, Lonestar)</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Receipt (Screenshot/Photo)
                          </label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                          {receiptFile && (
                            <p className="text-sm text-gray-600 mt-2">
                              Selected: {receiptFile.name}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={handleUploadPayment}
                          disabled={actionLoading || !receiptFile}
                          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {actionLoading ? 'Uploading...' : 'Submit Payment Receipt'}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {request.status === 'payment_uploaded' && (
                  <div className="bg-teal-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="text-teal-600" size={20} />
                      <span className="font-semibold text-teal-900">Payment Receipt Uploaded</span>
                    </div>
                    <p className="text-sm text-teal-700 mb-3">
                      Your payment receipt is being verified by the doctor. You'll be notified once confirmed.
                    </p>
                    {request.has_receipt && (
                      <button
                        onClick={downloadReceipt}
                        className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                      >
                        <Download size={18} />
                        <span>View Uploaded Receipt</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Messages/Communication - WhatsApp Style */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <MessageSquare className="mr-2" size={24} />
                  Communication
                </h2>
                <p className="text-blue-100 text-sm mt-1">Messages update automatically</p>
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
                        msg.sender_role === 'client' ? 'justify-end' : 'justify-start'
                      }`}>
                        <div className={`max-w-[75%] ${
                          msg.sender_role === 'client' 
                            ? 'bg-blue-500 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl' 
                            : 'bg-white text-gray-900 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl shadow-sm'
                        } px-4 py-3`}>
                          {msg.sender_role !== 'client' && (
                            <p className="text-xs font-semibold text-emerald-600 mb-1">{msg.sender_name}</p>
                          )}
                          {msg.message && (
                            <p className={`text-sm whitespace-pre-wrap break-words ${
                              msg.sender_role === 'client' ? 'text-white' : 'text-gray-800'
                            }`}>{msg.message}</p>
                          )}
                          {msg.has_attachment && (
                            <button
                              onClick={() => handleViewAttachment(msg.id, msg.attachment_filename || 'file', msg.attachment_type || '')}
                              className={`flex items-center space-x-2 mt-2 px-3 py-2 rounded-lg text-sm ${
                                msg.sender_role === 'client' 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              <Paperclip size={14} />
                              <span className="font-medium">{msg.attachment_filename}</span>
                              <Download size={12} />
                            </button>
                          )}
                          <p className={`text-xs mt-1 ${
                            msg.sender_role === 'client' ? 'text-blue-100' : 'text-gray-500'
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
                  <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg mb-3 border border-blue-200">
                    <Paperclip size={16} className="text-blue-600" />
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      style={{minHeight: '48px', maxHeight: '120px'}}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || (!newMessage.trim() && !messageFile)}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Send message"
                  >
                    <Send size={22} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">Press Enter to send, Shift+Enter for new line</p>
              </div>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Consultant Info */}
            {request.doctor_name && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-gray-900 mb-4">Assigned Consultant</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Name:</strong> {request.doctor_name}
                  </p>
                  <p className="text-sm">
                    <strong>Email:</strong> {request.doctor_email}
                  </p>
                </div>
              </div>
            )}

            {/* Status Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">Request Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span>Submitted</span>
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
                {request.status === 'completed' && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span>Completed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Section - Only show for completed assignments */}
            {request.status === 'completed' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Star className="text-yellow-500" size={20} />
                  <span>Rate Your Experience</span>
                </h3>
                
                {existingRating ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={24}
                          className={star <= existingRating.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'}
                        />
                      ))}
                    </div>
                    {existingRating.review && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{existingRating.review}</p>
                      </div>
                    )}
                    <button
                      onClick={() => setShowRatingForm(true)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Update Rating
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Help others by rating your experience with {request.doctor_name || 'the doctor'}.
                    </p>
                    <button
                      onClick={() => setShowRatingForm(true)}
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                    >
                      <Star size={18} />
                      <span>Rate Now</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Help */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
              <p className="text-xs text-blue-700">
                If you have questions about this request, you can contact support or wait for the doctor to respond.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Styled Accept Price Dialog */}
      {showAcceptDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Check className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Accept Price & Proceed to Payment
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-gray-700 text-lg mb-4">
                You're about to accept this price and proceed to payment. Are you sure?
              </p>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-green-900 font-semibold text-sm">Total Amount:</span>
                  <span className="text-4xl font-bold text-green-700">
                    {request?.currency} ${request?.final_price || request?.proposed_price}
                  </span>
                </div>
                {request?.doctor_notes && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>Doctor's Note:</strong> {request.doctor_notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-blue-800 flex items-start">
                    <span className="mr-2">✓</span>
                    <span>After accepting, you'll be directed to upload your payment receipt</span>
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-sm text-purple-800 flex items-start">
                    <span className="mr-2">💳</span>
                    <span>Payment methods: Mobile Money, Bank Transfer, or Cash</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 flex space-x-3">
              <button
                onClick={() => setShowAcceptDialog(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAcceptPrice}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
              >
                <Check size={20} />
                <span>{actionLoading ? 'Processing...' : 'Accept & Continue'}</span>
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

      {/* Rating Form Modal */}
      {showRatingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <Star className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {existingRating ? 'Update Your Rating' : 'Rate Your Experience'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowRatingForm(false)}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600 text-sm">
                  Rate your experience with <strong>{request.doctor_name || 'the doctor'}</strong> on this assignment.
                </p>
              </div>
              
              <RatingForm
                assignmentId={Number(params.id)}
                onSubmit={handleSubmitRating}
                onCancel={() => setShowRatingForm(false)}
                existingRating={existingRating?.rating || 0}
                existingReview={existingRating?.review || ''}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
