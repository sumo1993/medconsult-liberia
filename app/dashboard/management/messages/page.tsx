'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CheckCircle,
  ChevronLeft,
  MessageCircle,
  Search,
  Send,
  UserRound,
  XCircle,
} from 'lucide-react';
import PaginationControls from '@/components/PaginationControls';

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  latest_activity_at?: string;
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
  reply_to_text?: string | null;
  attachment_name?: string | null;
  has_attachment?: boolean;
}

const normalizeMessages = (input: unknown): Message[] => {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is Message => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<Message>;
    return typeof candidate.id !== 'undefined' && typeof candidate.message === 'string';
  });
};

const normalizeReplies = (input: unknown): Reply[] => {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is Reply => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<Reply>;
    return typeof candidate.id !== 'undefined' && typeof candidate.reply_text === 'string';
  });
};

const formatTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

const toTimestamp = (value: string): number => {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getSubjectBadgeClass = (subject: string): string => {
  switch (subject) {
    case 'appointment':
      return 'bg-blue-500/15 text-blue-300';
    case 'partnership':
      return 'bg-purple-500/15 text-purple-300';
    case 'donation':
      return 'bg-emerald-500/15 text-emerald-300';
    case 'research_report':
      return 'bg-teal-500/20 text-teal-200';
    default:
      return 'bg-slate-500/15 text-slate-300';
  }
};

export default function ManagementMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConversationOnMobile, setShowConversationOnMobile] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    const inboxTimer = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(inboxTimer);
  }, []);

  useEffect(() => {
    if (!selectedMessage?.id) return;
    const threadTimer = setInterval(() => {
      fetchReplies(selectedMessage.id);
    }, 1500);
    return () => clearInterval(threadTimer);
  }, [selectedMessage?.id]);

  useEffect(() => {
    const refreshNow = () => {
      fetchMessages();
      if (selectedMessage?.id) fetchReplies(selectedMessage.id);
    };
    window.addEventListener('focus', refreshNow);
    document.addEventListener('visibilitychange', refreshNow);
    return () => {
      window.removeEventListener('focus', refreshNow);
      document.removeEventListener('visibilitychange', refreshNow);
    };
  }, [selectedMessage?.id]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/contact?t=${Date.now()}`, {
        cache: 'no-store',
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
      const response = await fetch(`/api/messages/${messageId}/replies?t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    fetchReplies(message.id);
    setShowConversationOnMobile(true);
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reply_text: replyText }),
      });

      if (response.ok) {
        await response.json();
        await fetchReplies(selectedMessage.id);
        await fetchMessages();
        setReplyText('');
        setNotification({ type: 'success', message: 'Reply sent successfully!' });
        setTimeout(() => setNotification(null), 3000);
      } else {
        let errorMessage = `Failed to send reply (${response.status})`;
        try {
          const rawText = await response.text();
          if (rawText) {
            try {
              const parsed = JSON.parse(rawText) as { details?: string; error?: string };
              errorMessage = parsed.details || parsed.error || errorMessage;
            } catch {
              errorMessage = rawText;
            }
          }
        } catch {}
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send reply.';
      setNotification({ type: 'error', message });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSendingReply(false);
    }
  };

  const sortedMessages = [...messages].sort((a, b) => {
    const aTime = new Date(a.latest_activity_at || a.created_at).getTime();
    const bTime = new Date(b.latest_activity_at || b.created_at).getTime();
    return bTime - aTime;
  });

  const filteredMessages = sortedMessages.filter((msg) => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return true;
    return (
      msg.name.toLowerCase().includes(needle) ||
      msg.email.toLowerCase().includes(needle) ||
      msg.subject.toLowerCase().includes(needle) ||
      msg.message.toLowerCase().includes(needle)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / itemsPerPage));
  const paginatedMessages = filteredMessages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [messages, searchTerm]);

  useEffect(() => {
    if (!selectedMessage && sortedMessages.length > 0) {
      setSelectedMessage(sortedMessages[0]);
      fetchReplies(sortedMessages[0].id);
    }
  }, [selectedMessage, sortedMessages]);

  const conversationItems = selectedMessage
    ? [
        {
          id: `origin-${selectedMessage.id}`,
          seqId: Number(selectedMessage.id) || 0,
          sourceId: Number(selectedMessage.id) || 0,
          fromSelf: false,
          sender: selectedMessage.name || 'Client',
          text: selectedMessage.message,
          at: selectedMessage.created_at,
          showReceipt: false,
          isRead: false,
          replyToText: null as string | null,
          hasAttachment: false,
          attachmentName: null as string | null,
        },
        ...replies.map((reply) => ({
          id: `reply-${reply.id}`,
          seqId: Number(reply.id) || 0,
          sourceId: Number(reply.id) || 0,
          fromSelf: reply.replier_role === 'management' || reply.replier_role === 'admin',
          sender: reply.replier_name || 'User',
          text: reply.reply_text,
          at: reply.replied_at,
          showReceipt: reply.replier_role === 'management' || reply.replier_role === 'admin',
          isRead: Boolean(reply.is_read),
          replyToText: reply.reply_to_text || null,
          hasAttachment: Boolean(reply.has_attachment || reply.attachment_name),
          attachmentName: reply.attachment_name || null,
        })),
      ].sort((a, b) => {
        const timeDiff = toTimestamp(a.at) - toTimestamp(b.at);
        if (timeDiff !== 0) return timeDiff;
        return a.seqId - b.seqId;
      })
    : [];

  return (
    <div className="h-screen overflow-hidden bg-[#0b141a] text-white flex flex-col">
      <header className="shrink-0 border-b border-[#1f2c33] bg-[#111b21]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/management')}
              className="rounded-full p-2 text-slate-300 transition hover:bg-[#1f2c33] hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Client Messages</h1>
              <p className="text-xs text-slate-400 sm:text-sm">WhatsApp-style support inbox</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] w-full flex-1 min-h-0 overflow-hidden p-3 sm:p-4">
        <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden rounded-2xl border border-[#1f2c33] bg-[#111b21] lg:grid-cols-[360px_1fr]">
          <aside className={`${showConversationOnMobile ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-r border-[#1f2c33] bg-[#111b21]`}>
            <div className="border-b border-[#1f2c33] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Chats</h2>
                <span className="rounded-full bg-[#00a884]/20 px-2 py-0.5 text-xs font-semibold text-[#6bf7d1]">
                  {filteredMessages.length}
                </span>
              </div>
              <div className="flex items-center rounded-xl border border-[#2a3942] bg-[#0b141a] px-3 py-2">
                <Search size={16} className="mr-2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, subject"
                  className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 divide-y divide-[#1f2c33] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-slate-400">Loading chats...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <MessageCircle size={40} className="mx-auto mb-2 text-slate-600" />
                  <p>No messages found</p>
                </div>
              ) : (
                paginatedMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`cursor-pointer px-4 py-3 transition ${
                      selectedMessage?.id === message.id ? 'bg-[#2a3942]' : 'hover:bg-[#1f2c33]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884]/25">
                        <UserRound size={18} className="text-[#6bf7d1]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="truncate font-semibold text-slate-100">{message.name || 'Client'}</p>
                          <span className="shrink-0 text-xs text-slate-400">{formatTime(message.created_at)}</span>
                        </div>
                        <p className="mb-2 truncate text-sm text-slate-400">{message.message}</p>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getSubjectBadgeClass(message.subject)}`}>
                            {message.subject}
                          </span>
                          <span className="truncate text-[11px] text-slate-500">{message.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#1f2c33] p-3">
              <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </aside>

          <section className={`${showConversationOnMobile ? 'flex' : 'hidden lg:flex'} relative min-h-0 flex-col bg-[#0b141a]`}>
            {selectedMessage ? (
              <>
                <div className="flex items-center gap-3 border-b border-[#1f2c33] bg-[#202c33] px-4 py-3">
                  <button
                    onClick={() => setShowConversationOnMobile(false)}
                    className="rounded-full p-1.5 text-slate-300 transition hover:bg-[#2a3942] lg:hidden"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884]/25">
                    <UserRound size={18} className="text-[#6bf7d1]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{selectedMessage.name || 'Client'}</p>
                    <p className="truncate text-xs text-slate-400">{selectedMessage.email}</p>
                  </div>
                </div>

                <div className="relative min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:22px_22px]" />
                  <div className="relative mx-auto w-full max-w-4xl space-y-3">
                    <div className="mx-auto mb-6 inline-flex rounded-full bg-[#202c33] px-3 py-1 text-xs text-slate-300">
                      {selectedMessage.subject} • {formatDateTime(selectedMessage.created_at)}
                    </div>

                    {conversationItems.map((item) => (
                      <div key={item.id} className={`flex ${item.fromSelf ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ${
                            item.fromSelf
                              ? 'rounded-tr-md bg-[#005c4b] text-[#e9edef]'
                              : 'rounded-tl-md bg-[#202c33] text-slate-100'
                          }`}
                        >
                          <p className="mb-1 text-xs font-semibold text-slate-300/90">{item.fromSelf ? 'Doctor' : item.sender}</p>
                          {item.replyToText && (
                            <div className="mb-2 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-300">
                              <span className="font-semibold">Reply:</span> {item.replyToText}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{item.text}</p>
                          {item.hasAttachment && (
                            <a
                              href={`/api/messages/${selectedMessage.id}/replies/${item.sourceId}/attachment`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-sky-200 hover:text-sky-100"
                            >
                              📎 <span className="truncate">{item.attachmentName || 'Attachment'}</span>
                            </a>
                          )}
                          <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-slate-300/80">
                            <span>{formatTime(item.at)}</span>
                            {item.showReceipt && (
                              item.isRead ? (
                                <CheckCheck size={12} className="text-sky-300" />
                              ) : (
                                <Check size={12} className="text-slate-300" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#1f2c33] bg-[#111b21] p-3 sm:p-4">
                  <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-2xl bg-[#202c33] p-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={1}
                      className="max-h-32 min-h-[42px] flex-1 resize-y rounded-xl bg-transparent px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                      placeholder="Type a reply to client"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sendingReply}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-[#081c15] transition hover:bg-[#16c79a] disabled:cursor-not-allowed disabled:opacity-50"
                      title="Send"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-400">
                <MessageCircle size={56} className="mb-4 text-slate-600" />
                <p className="text-lg font-medium text-slate-300">Select a chat to start messaging</p>
                <p className="mt-1 text-sm">Pick a conversation from the left panel.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-xl px-5 py-4 text-center shadow-2xl ${
              notification.type === 'success' ? 'bg-[#10261f] text-[#baf5e2]' : 'bg-[#2b1616] text-[#ffd0d0]'
            }`}
          >
            <div className="mb-2 flex justify-center">
              {notification.type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
