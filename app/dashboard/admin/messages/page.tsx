'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Clock } from 'lucide-react';

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/contact');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectBadgeColor = (subject: string) => {
    switch (subject) {
      case 'appointment':
        return 'bg-blue-100 text-blue-800';
      case 'partnership':
        return 'bg-purple-100 text-purple-800';
      case 'donation':
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
              onClick={() => router.push('/dashboard/admin')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
              <p className="text-sm text-gray-600">View all contact form submissions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">All Messages ({messages.length})</h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No messages yet</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedMessage?.id === message.id ? 'bg-blue-50' : ''
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
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            {selectedMessage ? (
              <div className="p-6">
                <div className="border-b pb-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedMessage.name}
                  </h2>
                  <p className="text-sm text-gray-600">{selectedMessage.email}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getSubjectBadgeColor(selectedMessage.subject)}`}>
                      {selectedMessage.subject}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button className="px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800">
                    Reply
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    Archive
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Mail size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
