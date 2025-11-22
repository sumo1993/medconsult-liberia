'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Clock, MessageCircle, Send, CheckCircle, XCircle } from 'lucide-react';

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  user_id: number;
}

interface Reply {
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

export default function ClientInboxPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // Get user ID
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserId(user.id);
    }
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/contact');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched messages:', data.messages);
        // Filter to only show current user's messages
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const userMessages = data.messages.filter((msg: Message) => msg.user_id === user.id);
          console.log('Filtered user messages:', userMessages);
          setMessages(userMessages);
        }
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
        setReplies(data.replies || []);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    setReplyText('');
    fetchReplies(message.id);
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    // Validate message ID
    if (!selectedMessage.id || isNaN(Number(selectedMessage.id))) {
      console.error('Invalid message ID:', selectedMessage);
      setNotification({ 
        type: 'error', 
        message: 'Invalid message ID. Please refresh and try again.' 
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    setSendingReply(true);
    try {
      const token = localStorage.getItem('auth-token');
      const messageId = Number(selectedMessage.id);
      const response = await fetch(`/api/messages/${messageId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reply_text: replyText }),
      });

      if (response.ok) {
        const data = await response.json();
        setReplies([...replies, data.reply]);
        setReplyText('');
        setNotification({ type: 'success', message: 'Reply sent successfully!' });
        setTimeout(() => setNotification(null), 3000);
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to send reply');
      }
    } catch (error: any) {
      console.error('Error sending reply:', error);
      setNotification({ 
        type: 'error', 
        message: error.message || 'Failed to send reply. Check console for details.' 
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSendingReply(false);
    }
  };

  const getSubjectBadgeColor = (subject: string) => {
    switch (subject) {
      case 'appointment':
        return 'bg-blue-100 text-blue-800';
      case 'assignment':
        return 'bg-purple-100 text-purple-800';
      case 'research':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/client')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Messages</h1>
              <p className="text-sm text-gray-600">View your messages and doctor replies</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-emerald-700 text-white px-4 py-3">
              <h2 className="font-semibold">Inbox ({messages.length})</h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Mail size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No messages yet</p>
                  <button
                    onClick={() => router.push('/dashboard/client/messages')}
                    className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
                  >
                    Send a Message
                  </button>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-emerald-50 border-l-4 border-emerald-700' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">To: Doctor</p>
                        <p className="text-sm text-gray-500 truncate">{message.message.substring(0, 50)}...</p>
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
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            {selectedMessage ? (
              <div className="p-6">
                <div className="border-b pb-4 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Your Message to Doctor
                  </h2>
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
                        <p className="font-semibold text-gray-900">You</p>
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
                                {reply.replier_role === 'management' || reply.replier_role === 'admin' ? 'Doctor' : reply.replier_name || 'You'}
                                {(reply.replier_role === 'management' || reply.replier_role === 'admin') && (
                                  <span className="ml-2 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                    Doctor
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
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Reply to Doctor</h3>
                  <div className="space-y-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                      placeholder="Type your reply here..."
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || sendingReply}
                        className="flex items-center space-x-2 px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                      >
                        <Send size={18} />
                        <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 h-full flex flex-col items-center justify-center">
                <Mail size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a message to view conversation</p>
                <p className="text-sm mt-2">Click on any message from your inbox</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg border-l-4 ${
              notification.type === 'success'
                ? 'bg-white border-green-500'
                : 'bg-white border-red-500'
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
