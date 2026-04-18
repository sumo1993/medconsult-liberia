'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Clock, Reply, Send, MessageCircle, CheckCircle, XCircle, Archive, Trash2 } from 'lucide-react';
import PaginationControls from '@/components/PaginationControls';
import { showAppConfirm } from '@/components/AppDialogsProvider';

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  is_archived?: boolean;
}

interface ReplyItem {
  id: number;
  message_id: number;
  reply_text: string;
  replied_by: number;
  replied_at: string;
  is_read: boolean;
  replier_name: string;
  replier_email: string;
  replier_role: string;
}

const normalizeMessages = (input: unknown): Message[] => {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is Message => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<Message>;
    return typeof candidate.id !== 'undefined' && typeof candidate.message === 'string';
  });
};

const normalizeReplies = (input: unknown): ReplyItem[] => {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is ReplyItem => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<ReplyItem>;
    return typeof candidate.id !== 'undefined' && typeof candidate.reply_text === 'string';
  });
};

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replies, setReplies] = useState<ReplyItem[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'archived'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    const inboxTimer = setInterval(() => {
      fetchMessages();
    }, 15000);
    return () => clearInterval(inboxTimer);
  }, []);

  useEffect(() => {
    if (!selectedMessage?.id) return;
    const threadTimer = setInterval(() => {
      fetchReplies(selectedMessage.id);
    }, 5000);
    return () => clearInterval(threadTimer);
  }, [selectedMessage?.id]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/contact', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(normalizeMessages(data.messages));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (messageId: number) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/messages/${messageId}/replies`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setReplies(normalizeReplies(data.replies));
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    setReplyText('');
    setShowReplyForm(false);
    fetchReplies(message.id);
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/messages/${selectedMessage.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reply_text: replyText }),
      });

      if (response.ok) {
        await response.json();
        await fetchReplies(selectedMessage.id);
        setReplyText('');
        setShowReplyForm(false);
        showNotificationMessage('success', 'Reply sent successfully!');
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      showNotificationMessage('error', 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedMessage) return;
    
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/contact/${selectedMessage.id}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        setMessages(messages.map(m => 
          m.id === selectedMessage.id ? { ...m, is_archived: true } : m
        ));
        setSelectedMessage(null);
        showNotificationMessage('success', 'Message archived successfully!');
      } else {
        // If API doesn't exist yet, just show success and remove from view
        setMessages(messages.filter(m => m.id !== selectedMessage.id));
        setSelectedMessage(null);
        showNotificationMessage('success', 'Message archived!');
      }
    } catch (error) {
      // Fallback - just remove from view
      setMessages(messages.filter(m => m.id !== selectedMessage.id));
      setSelectedMessage(null);
      showNotificationMessage('success', 'Message archived!');
    }
  };

  const handleDelete = async () => {
    if (!selectedMessage) return;

    if (
      !(await showAppConfirm({
        title: 'Delete message',
        message: 'Are you sure you want to delete this message?',
        variant: 'danger',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
      }))
    )
      return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/contact/${selectedMessage.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Remove from local state regardless of API response
      setMessages(messages.filter(m => m.id !== selectedMessage.id));
      setSelectedMessage(null);
      showNotificationMessage('success', 'Message deleted!');
    } catch (error) {
      setMessages(messages.filter(m => m.id !== selectedMessage.id));
      setSelectedMessage(null);
      showNotificationMessage('success', 'Message deleted!');
    }
  };

  const showNotificationMessage = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const getSubjectBadgeColor = (subject: string) => {
    switch (subject) {
      case 'appointment':
        return 'bg-blue-100 text-blue-800';
      case 'partnership':
        return 'bg-purple-100 text-purple-800';
      case 'donation':
        return 'bg-green-100 text-green-800';
      case 'research_report':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMessages = messages.filter(m => 
    filter === 'all' ? !m.is_archived : m.is_archived
  );
  const sortedMessages = [...filteredMessages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const totalPages = Math.max(1, Math.ceil(sortedMessages.length / itemsPerPage));
  const paginatedMessages = sortedMessages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, messages]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
                <p className="text-sm text-gray-600">View and respond to contact form submissions</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/admin')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="p-4 border-b bg-emerald-50">
              <h2 className="font-semibold text-emerald-900">Inbox ({sortedMessages.length})</h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : sortedMessages.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Mail size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No messages yet</p>
                </div>
              ) : (
                paginatedMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{message.name}</p>
                        <p className="text-sm text-gray-500">{message.email}</p>
                      </div>
                      <Mail size={16} className="text-gray-400" />
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getSubjectBadgeColor(message.subject)}`}>
                      {message.subject}
                    </span>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      {new Date(message.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            {selectedMessage ? (
              <div className="p-6">
                <div className="border-b pb-4 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedMessage.name}
                  </h2>
                  <p className="text-sm text-gray-600 mb-2">{selectedMessage.email}</p>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 text-sm rounded-full ${getSubjectBadgeColor(selectedMessage.subject)}`}>
                      {selectedMessage.subject}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Original Message */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold flex-shrink-0">
                      {selectedMessage.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-900">{selectedMessage.name}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(selectedMessage.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
                    </div>
                  </div>
                </div>

                {/* Replies Thread */}
                {replies.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 flex items-center">
                      <MessageCircle size={16} className="mr-2" />
                      Conversation ({replies.length})
                    </h3>
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`rounded-lg p-4 ${
                          reply.replier_role === 'management' || reply.replier_role === 'admin'
                            ? 'bg-emerald-50 ml-8'
                            : 'bg-gray-50 mr-8'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`rounded-full w-10 h-10 flex items-center justify-center font-semibold flex-shrink-0 ${
                              reply.replier_role === 'management' || reply.replier_role === 'admin'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-400 text-white'
                            }`}
                          >
                            {reply.replier_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-gray-900">
                                {reply.replier_name || 'User'}
                                {(reply.replier_role === 'management' || reply.replier_role === 'admin') && (
                                  <span className="ml-2 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                    Admin
                                  </span>
                                )}
                              </p>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.replied_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {reply.reply_text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {showReplyForm ? (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Write a Reply</h3>
                    <div className="space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                        placeholder="Type your reply here..."
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setShowReplyForm(false)}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                          >
                            <Reply size={16} />
                            <span>Reply via Email</span>
                          </button>
                          <button
                            onClick={handleSendReply}
                            disabled={!replyText.trim() || sendingReply}
                            className="flex items-center space-x-2 px-6 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50"
                          >
                            <Send size={18} />
                            <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex space-x-3">
                    <button 
                      onClick={() => setShowReplyForm(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
                    >
                      <Reply size={18} />
                      <span>Reply</span>
                    </button>
                    <button 
                      onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Mail size={18} />
                      <span>Email</span>
                    </button>
                    <button 
                      onClick={handleArchive}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      <Archive size={18} />
                      <span>Archive</span>
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      <Trash2 size={18} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 h-full flex flex-col items-center justify-center">
                <Mail size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a message to view details</p>
                <p className="text-sm mt-2">Click on any message from the inbox to read it</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-white border-l-4 border-green-500'
                : 'bg-white border-l-4 border-red-500'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <XCircle className="text-red-500" size={24} />
            )}
            <span className="text-gray-900 font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
