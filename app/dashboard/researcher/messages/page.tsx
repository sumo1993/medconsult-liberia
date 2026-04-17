'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, MessageSquare, Search, X, Check, CheckCheck, Reply, Smile, Undo2, Heart, Paperclip, Pin, Wifi, WifiOff, RefreshCcw, Pencil } from 'lucide-react';
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
  edited_at?: string | null;
  temp_status?: 'sending' | 'failed';
}

export default function ResearcherDirectMessagesPage() {
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
  const [isOnline, setIsOnline] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [retryPayload, setRetryPayload] = useState<{ userId: number; message: string; attachment: typeof attachment; replyToId: number | null } | null>(null);
  const [pinnedUserIds, setPinnedUserIds] = useState<number[]>([]);
  const [presenceByUserId, setPresenceByUserId] = useState<Record<number, { active: boolean; last_active: string | null }>>({});
  const [emojiSearch, setEmojiSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const emojiList = ['😀', '😁', '😂', '😊', '😍', '👍', '❤️', '🙏', '🎉', '😮'];
  const emojiMeta: Record<string, string> = {
    '😀': 'grinning',
    '😁': 'beaming',
    '😂': 'joy',
    '😊': 'smile',
    '😍': 'heart eyes',
    '👍': 'thumbs up',
    '❤️': 'heart',
    '🙏': 'prayer',
    '🎉': 'celebration',
    '😮': 'surprised',
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchConversations();
  }, []);

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('dm_pins_researcher');
      if (raw) {
        const parsed = JSON.parse(raw) as number[];
        if (Array.isArray(parsed)) setPinnedUserIds(parsed);
      }
    } catch {}
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
    if (!shouldAutoScrollRef.current) return;
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

    setSendError(null);
    const payload = {
      userId: selectedUser.id,
      message: newMessage.trim(),
      attachment,
      replyToId: replyTo?.id || null,
    };
    const optimisticMessage: Message = {
      id: -Date.now(),
      sender_id: currentUserId || 0,
      receiver_id: selectedUser.id,
      message: payload.message,
      sender_name: 'You',
      sender_role: 'researcher',
      attachment_filename: payload.attachment?.name || null,
      attachment_type: payload.attachment?.type || null,
      is_read: false,
      created_at: new Date().toISOString(),
      reply_to_id: payload.replyToId,
      temp_status: 'sending',
    };
    setMessages((prev) => sortMessages([...prev, optimisticMessage]));

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
          receiverId: payload.userId,
          message: payload.message,
          attachment: payload.attachment?.dataUrl || null,
          filename: payload.attachment?.name || null,
          replyToId: payload.replyToId,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setAttachment(null);
        setReplyTo(null);
        setRetryPayload(null);
        fetchMessages(selectedUser.id);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSendError('Message failed to send. You can retry.');
      setRetryPayload(payload);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMessage.id
            ? { ...m, temp_status: 'failed' }
            : m
        )
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const retrySend = async () => {
    if (!retryPayload) return;
    setNewMessage(retryPayload.message);
    setAttachment(retryPayload.attachment);
    setTimeout(() => {
      handleSendMessage();
    }, 0);
  };

  const togglePin = (userId: number) => {
    setPinnedUserIds((prev) => {
      const next = prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId];
      localStorage.setItem('dm_pins_researcher', JSON.stringify(next));
      return next;
    });
  };

  const startNewChat = (user: UserToChat) => {
    shouldAutoScrollRef.current = true;
    setSelectedUser(user);
    setShowNewChat(false);
    setMessages([]);
    fetchMessages(user.id);
  };

  const selectConversation = (conv: Conversation) => {
    shouldAutoScrollRef.current = true;
    const user = users.find(u => u.id === conv.user_id) || {
      id: conv.user_id,
      full_name: conv.full_name,
      email: '',
      role: conv.role,
    };
    setSelectedUser(user);
    fetchMessages(conv.user_id);
  };

  const handleMessagesScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 120;
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
      case 'client': return 'bg-green-100 text-green-700';
      case 'researcher': return 'bg-orange-100 text-orange-700';
      case 'accountant': return 'bg-yellow-100 text-yellow-700';
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

  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = pinnedUserIds.includes(a.user_id);
    const bPinned = pinnedUserIds.includes(b.user_id);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    if ((a.unread_count > 0) !== (b.unread_count > 0)) return a.unread_count > 0 ? -1 : 1;
    return toTimestamp(b.last_message_at) - toTimestamp(a.last_message_at);
  });

  const filteredComposerEmojis = emojiList.filter((emoji) =>
    !emojiSearch.trim() || (emojiMeta[emoji] || '').includes(emojiSearch.toLowerCase())
  );

  const saveEditMessage = async (messageId: number, updatedText: string) => {
    if (!updatedText.trim()) return;
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/direct-messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messageId, action: 'edit', message: updatedText.trim() }),
      });
      if (response.ok && selectedUser) {
        fetchMessages(selectedUser.id);
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

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
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group users by role
  const usersByRole = filteredUsers.reduce((acc, user) => {
    if (!acc[user.role]) acc[user.role] = [];
    acc[user.role].push(user);
    return acc;
  }, {} as Record<string, UserToChat[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/researcher')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Direct Messages</h1>
                <p className="text-sm text-gray-600">Chat with admin and accountant team</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <button
                onClick={() => setShowNewChat(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                New Message
              </button>
            </div>
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
                <h3 className="font-semibold text-gray-900">All Conversations</h3>
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
                  sortedConversations.map((conv) => (
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
                            <p className="font-semibold text-gray-900 truncate flex items-center gap-1">
                              {pinnedUserIds.includes(conv.user_id) && <Pin size={12} className="text-amber-600" />}
                              {conv.full_name}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(conv.user_id);
                                }}
                                className="text-gray-400 hover:text-amber-600"
                                title="Pin conversation"
                              >
                                <Pin size={12} />
                              </button>
                              <span className="text-xs text-gray-500">
                                {conv.last_message_at && formatTime(conv.last_message_at)}
                              </span>
                            </div>
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
                  <div
                    ref={chatScrollRef}
                    onScroll={handleMessagesScroll}
                    className="flex-1 overflow-y-auto p-4 bg-gray-50"
                  >
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
                        const showUnreadDivider =
                          !isOwn &&
                          !msg.is_read &&
                          (index === 0 || !!list[index - 1]?.is_read);
                        return (
                          <div key={msg.id}>
                            {showDateHeader && (
                              <div className="my-4 flex items-center justify-center">
                                <span className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700">
                                  {formatDateHeader(msg.created_at)}
                                </span>
                              </div>
                            )}
                            {showUnreadDivider && (
                              <div className="my-2 flex items-center gap-2">
                                <div className="h-px flex-1 bg-emerald-200" />
                                <span className="text-[10px] uppercase font-semibold text-emerald-600">New Messages</span>
                                <div className="h-px flex-1 bg-emerald-200" />
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
                                  {msg.edited_at && !msg.is_deleted && (
                                    <p className={`mt-1 text-[10px] ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>edited</p>
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
                                  {msg.temp_status === 'sending' && <span className="text-amber-600">Sending...</span>}
                                  {msg.temp_status === 'failed' && <span className="text-red-600">Failed</span>}
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
                                  {isOwn && !msg.is_deleted && (
                                    <button
                                      onClick={() => {
                                        const nextText = prompt('Edit message', msg.message || '');
                                        if (!nextText || !nextText.trim()) return;
                                        saveEditMessage(msg.id, nextText.trim());
                                      }}
                                      className="text-gray-500 hover:text-gray-800 flex items-center gap-1"
                                      title="Edit"
                                    >
                                      <Pencil size={12} />
                                      Edit
                                    </button>
                                  )}
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
                    {sendError && (
                      <div className="mb-2 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <span>{sendError}</span>
                        {retryPayload && (
                          <button
                            onClick={retrySend}
                            className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200"
                          >
                            <RefreshCcw size={12} />
                            Retry
                          </button>
                        )}
                      </div>
                    )}
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
                            <input
                              type="text"
                              value={emojiSearch}
                              onChange={(e) => setEmojiSearch(e.target.value)}
                              placeholder="Search emoji"
                              className="mb-2 w-full rounded border border-gray-200 px-2 py-1 text-xs"
                            />
                            <div className="grid grid-cols-5 gap-1">
                              {filteredComposerEmojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    setNewMessage((prev) => `${prev}${emoji}`);
                                    setShowEmojiPicker(false);
                                    setEmojiSearch('');
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
                        onKeyDown={(e) => {
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
                        {sendingMessage ? <span className="text-xs font-medium">Sending</span> : <Send size={20} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="mx-auto mb-3 text-gray-300" size={64} />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm">or start a new chat with anyone</p>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">New Message - Select Recipient</h3>
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
                  placeholder="Search by name, email or role..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="max-h-96 overflow-y-auto">
                {Object.entries(usersByRole).map(([role, roleUsers]) => (
                  <div key={role} className="mb-4">
                    <h4 className={`text-xs font-semibold uppercase px-2 py-1 rounded ${getRoleBadgeColor(role)} mb-2`}>
                      {role} ({roleUsers.length})
                    </h4>
                    {roleUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => startNewChat(user)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <UserPhotoAvatar userId={user.id} name={user.full_name} isActive={Boolean(presenceByUserId[user.id]?.active)} />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
