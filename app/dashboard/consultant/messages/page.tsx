'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, MessageSquare, User, Search, Paperclip, X, Check, CheckCheck } from 'lucide-react';

interface UserToChat {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

interface Conversation {
  user_id: number;
  full_name: string;
  role: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  sender_name: string;
  sender_role: string;
  attachment_filename: string | null;
  attachment_type: string | null;
  is_read: boolean;
  created_at: string;
}

export default function ConsultantMessagesPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserToChat[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserToChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
      const interval = setInterval(() => fetchMessages(selectedUser.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/profile', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/direct-messages/users', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/direct-messages', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (userId: number) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/direct-messages?with=${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        fetchConversations(); // Refresh unread counts
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages(selectedUser.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const startNewChat = (user: UserToChat) => {
    setSelectedUser(user);
    setShowNewChat(false);
    setMessages([]);
    fetchMessages(user.id);
  };

  const selectConversation = (conv: Conversation) => {
    const user = users.find(u => u.id === conv.user_id) || {
      id: conv.user_id,
      full_name: conv.full_name,
      email: '',
      role: conv.role,
    };
    setSelectedUser(user);
    fetchMessages(conv.user_id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'management': return 'bg-purple-100 text-purple-700';
      case 'consultant': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/consultant')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                <p className="text-sm text-gray-600">Chat with Management & Admin</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              New Message
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900">Conversations</h3>
              </div>
              <div className="overflow-y-auto" style={{ height: 'calc(100% - 57px)' }}>
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="mx-auto mb-3 text-gray-300" size={48} />
                    <p className="text-sm">No conversations yet</p>
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="mt-3 text-emerald-600 hover:underline text-sm"
                    >
                      Start a new chat
                    </button>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.user_id}
                      onClick={() => selectConversation(conv)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedUser?.id === conv.user_id ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-semibold">
                          {conv.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 truncate">{conv.full_name}</p>
                            <span className="text-xs text-gray-500">
                              {conv.last_message_at && formatTime(conv.last_message_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(conv.role)}`}>
                              {conv.role}
                            </span>
                            {conv.unread_count > 0 && (
                              <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">{conv.last_message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold">
                        {selectedUser.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{selectedUser.full_name}</p>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                          {selectedUser.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <MessageSquare className="mx-auto mb-3 text-gray-300" size={48} />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.sender_id === currentUserId;
                        return (
                          <div key={msg.id} className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                              <div className={`px-4 py-2 rounded-2xl ${
                                isOwn 
                                  ? 'bg-emerald-500 text-white rounded-br-none' 
                                  : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                              }`}>
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : ''}`}>
                                <span>{formatTime(msg.created_at)}</span>
                                {isOwn && (
                                  msg.is_read 
                                    ? <CheckCheck size={14} className="text-emerald-500" />
                                    : <Check size={14} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t bg-white">
                    <div className="flex items-end gap-2">
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                        className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="mx-auto mb-3 text-gray-300" size={64} />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm">or start a new chat</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-emerald-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">New Message</h3>
              <button
                onClick={() => setShowNewChat(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or role..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No users found</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => startNewChat(user)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-semibold">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{user.full_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
