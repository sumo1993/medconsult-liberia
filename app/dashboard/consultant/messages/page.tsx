'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, MessageSquare, Search, Paperclip, X, Check, CheckCheck, Reply, Smile, Undo2, Heart } from 'lucide-react';
import UserPhotoAvatar from '@/components/UserPhotoAvatar';

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
  reply_to_id?: number | null;
  reply_to_text?: string | null;
  reactions?: Record<string, number[]> | string | null;
  is_deleted?: boolean;
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
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionPickerForId, setReactionPickerForId] = useState<number | null>(null);
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    dataUrl: string;
    size: number;
  } | null>(null);
  const [presenceByUserId, setPresenceByUserId] = useState<Record<number, { active: boolean; last_active: string | null }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const emojiList = ['😀', '😁', '😂', '😊', '😍', '👍', '❤️', '🙏', '🎉', '😮'];

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchConversations();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
      const interval = setInterval(() => fetchMessages(selectedUser.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    const ids = Array.from(
      new Set([
        ...users.map((u) => u.id),
        ...conversations.map((c) => c.user_id),
        ...(selectedUser ? [selectedUser.id] : []),
      ])
    );
    if (ids.length === 0) return;
    fetchPresence(ids);
  }, [users, conversations, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    autoResizeComposer();
  }, [newMessage]);

  const autoResizeComposer = () => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, 160);
    el.style.height = `${Math.max(nextHeight, 44)}px`;
    el.style.overflowY = el.scrollHeight > 160 ? 'auto' : 'hidden';
  };

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
        const normalized = (data.messages || []).map((msg: Message) => ({
          ...msg,
          reactions: normalizeReactions(msg.reactions),
        }));
        setMessages(sortMessages(normalized));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchPresence = async (ids: number[]) => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;
      const response = await fetch(`/api/presence?ids=${ids.join(',')}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401) return;
      if (!response.ok) return;
      const data = await response.json();
      setPresenceByUserId(data.presence || {});
    } catch (error) {
      console.error('Error fetching presence:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser) return;
    if (!newMessage.trim() && !attachment) return;

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
          attachment: attachment?.dataUrl || null,
          filename: attachment?.name || null,
          replyToId: replyTo?.id || null,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setAttachment(null);
        setReplyTo(null);
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

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Africa/Monrovia',
    });
  };

  const formatDateHeader = (dateString?: string | null) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'Africa/Monrovia',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'management': return 'bg-purple-100 text-purple-700';
      case 'consultant': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const normalizeReactions = (input: Message['reactions']) => {
    if (!input) return {};
    if (typeof input === 'string') {
      try {
        return JSON.parse(input) as Record<string, number[]>;
      } catch {
        return {};
      }
    }
    return input as Record<string, number[]>;
  };

  const toTimestamp = (value?: string | null) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const sortMessages = (list: Message[]) =>
    [...list].sort((a, b) => {
      const idDiff = a.id - b.id;
      if (idDiff !== 0) return idDiff;
      return toTimestamp(a.created_at) - toTimestamp(b.created_at);
    });

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setAttachment({
        name: file.name,
        type: file.type || 'application/octet-stream',
        dataUrl: reader.result,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleReaction = async (messageId: number, emoji: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/direct-messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messageId, emoji }),
      });
      if (!response.ok) return;
      const data = await response.json();
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, reactions: data.reactions || {} } : msg
        )
      );
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const recallMessage = async (messageId: number) => {
    if (!confirm('Recall this message for everyone?')) return;
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/direct-messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messageId, action: 'recall' }),
      });
      if (response.ok && selectedUser) {
        fetchMessages(selectedUser.id);
      }
    } catch (error) {
      console.error('Error recalling message:', error);
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
                        <UserPhotoAvatar userId={conv.user_id} name={conv.full_name} isActive={Boolean(presenceByUserId[conv.user_id]?.active)} />
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
                      <UserPhotoAvatar userId={selectedUser.id} name={selectedUser.full_name} className="bg-white/20 ring-2 ring-white/20" isActive={Boolean(presenceByUserId[selectedUser.id]?.active)} />
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
                      sortMessages(messages).map((msg, index, list) => {
                        const isOwn = msg.sender_id === currentUserId;
                        const reactions = normalizeReactions(msg.reactions);
                        const showDateHeader =
                          index === 0 ||
                          formatDateHeader(list[index - 1]?.created_at) !== formatDateHeader(msg.created_at);
                        return (
                          <div key={msg.id}>
                            {showDateHeader && (
                              <div className="my-4 flex items-center justify-center">
                                <span className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700">
                                  {formatDateHeader(msg.created_at)}
                                </span>
                              </div>
                            )}
                            <div className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                                <div className={`px-4 py-2 rounded-2xl ${
                                  isOwn 
                                    ? 'bg-emerald-500 text-white rounded-br-none' 
                                    : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                                }`}>
                                  {msg.reply_to_text && (
                                    <div className={`mb-2 rounded-lg px-2 py-1 text-xs ${
                                      isOwn ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      Replying to: {msg.reply_to_text}
                                    </div>
                                  )}
                                  {msg.message && (
                                    <p className={`whitespace-pre-wrap ${msg.is_deleted ? 'italic text-gray-300' : ''}`}>
                                      {msg.message}
                                    </p>
                                  )}
                                  {msg.attachment_filename && (
                                    <a
                                      href={`/api/direct-messages/${msg.id}/attachment`}
                                      className={`mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs ${
                                        isOwn ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      <Paperclip size={12} />
                                      {msg.attachment_filename}
                                    </a>
                                  )}
                                </div>
                                <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : ''}`}>
                                  <span>{formatTime(msg.created_at)}</span>
                                  {isOwn && (
                                    msg.is_read 
                                      ? <CheckCheck size={14} className="text-emerald-500" />
                                      : <Check size={14} />
                                  )}
                                </div>
                                <div className={`mt-1 flex flex-wrap items-center gap-2 text-xs ${isOwn ? 'justify-end' : ''}`}>
                                  <button
                                    onClick={() => setReplyTo(msg)}
                                    className="text-gray-500 hover:text-gray-800 flex items-center gap-1"
                                    title="Reply"
                                  >
                                    <Reply size={12} />
                                    Reply
                                  </button>
                                  <button
                                    onClick={() => toggleReaction(msg.id, '❤️')}
                                    className="text-gray-500 hover:text-gray-800 flex items-center gap-1"
                                    title="Like"
                                  >
                                    <Heart size={12} />
                                    Like
                                  </button>
                                  <button
                                    onClick={() => setReactionPickerForId(reactionPickerForId === msg.id ? null : msg.id)}
                                    className="text-gray-500 hover:text-gray-800 flex items-center gap-1"
                                    title="React"
                                  >
                                    <Smile size={12} />
                                    React
                                  </button>
                                  {isOwn && !msg.is_deleted && (
                                    <button
                                      onClick={() => recallMessage(msg.id)}
                                      className="text-gray-500 hover:text-gray-800 flex items-center gap-1"
                                      title="Recall"
                                    >
                                      <Undo2 size={12} />
                                      Recall
                                    </button>
                                  )}
                                </div>
                                {reactionPickerForId === msg.id && (
                                  <div className="mt-2 w-fit rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
                                    <div className="grid grid-cols-5 gap-1">
                                    {emojiList.map((emoji) => (
                                      <button
                                        key={`${msg.id}-${emoji}`}
                                        onClick={() => {
                                          toggleReaction(msg.id, emoji);
                                          setReactionPickerForId(null);
                                        }}
                                        className="h-10 w-10 rounded-lg text-xl hover:bg-gray-100"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                    </div>
                                  </div>
                                )}
                                {Object.keys(reactions).length > 0 && (
                                  <div className={`mt-2 flex flex-wrap gap-2 ${isOwn ? 'justify-end' : ''}`}>
                                    {Object.entries(reactions).map(([emoji, userIds]) => (
                                      <button
                                        key={`${msg.id}-${emoji}`}
                                        onClick={() => toggleReaction(msg.id, emoji)}
                                        className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-50"
                                      >
                                        {emoji} {userIds.length}
                                      </button>
                                    ))}
                                  </div>
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
                    {replyTo && (
                      <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900 flex items-center justify-between">
                        <div className="truncate">
                          Replying to: {replyTo.message || replyTo.attachment_filename || 'Message'}
                        </div>
                        <button
                          onClick={() => setReplyTo(null)}
                          className="ml-2 text-emerald-700 hover:text-emerald-900"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {attachment && (
                      <div className="mb-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs">
                        <div className="truncate">
                          Attachment: {attachment.name}
                        </div>
                        <button
                          onClick={() => setAttachment(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleAttachmentChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-600 hover:text-gray-900"
                        title="Attach file"
                      >
                        <Paperclip size={18} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker((prev) => !prev)}
                          className="p-2 text-gray-600 hover:text-gray-900"
                          title="Add emoji"
                        >
                          <Smile size={18} />
                        </button>
                        {showEmojiPicker && (
                          <div className="absolute bottom-12 left-0 z-50 w-56 sm:left-1/2 sm:-translate-x-1/2 rounded-xl border border-gray-200 bg-white p-2 shadow-2xl">
                            <div className="grid grid-cols-5 gap-1">
                              {emojiList.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    setNewMessage((prev) => `${prev}${emoji}`);
                                    setShowEmojiPicker(false);
                                  }}
                                  className="h-10 w-10 rounded-lg text-xl hover:bg-gray-100"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <textarea
                        ref={composerRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onInput={autoResizeComposer}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 max-h-40 overflow-y-auto rounded-2xl border border-gray-300 px-4 py-2 leading-6 focus:border-gray-400 focus:outline-none focus:ring-0 resize-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || (!newMessage.trim() && !attachment)}
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
                        <UserPhotoAvatar userId={user.id} name={user.full_name} isActive={Boolean(presenceByUserId[user.id]?.active)} />
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
