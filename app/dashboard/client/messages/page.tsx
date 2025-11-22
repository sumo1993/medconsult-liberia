'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';

export default function ClientMessagesPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.full_name || 'Client',
          email: user?.email || '',
          subject: formData.subject,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: 'Message sent successfully! The doctor will respond soon.',
        });
        setFormData({ subject: '', message: '' });
      } else {
        setSubmitStatus({
          type: 'error',
          message: 'Failed to send message. Please try again.',
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please check your connection.',
      });
    } finally {
      setIsSubmitting(false);
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
              <h1 className="text-2xl font-bold text-gray-900">Contact Doctor</h1>
              <p className="text-sm text-gray-600">Send a message to get help and guidance</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
              <div className="mb-6">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select a subject...</option>
                  <option value="general">General Question</option>
                  <option value="assignment">Assignment Help</option>
                  <option value="research">Research Question</option>
                  <option value="appointment">Request Appointment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  rows={10}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Type your message here..."
                />
              </div>

              {submitStatus && (
                <div className={`mb-6 p-4 rounded-md ${
                  submitStatus.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {submitStatus.message}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/client')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:opacity-50"
                >
                  <Send size={18} />
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <MessageSquare className="text-emerald-700 mb-3" size={32} />
              <h3 className="font-semibold text-gray-900 mb-2">Quick Response</h3>
              <p className="text-sm text-gray-600">
                The doctor typically responds within 24-48 hours. For urgent matters, please indicate in your message.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
              <h3 className="font-semibold text-emerald-900 mb-3">Tips for Better Help</h3>
              <ul className="text-sm text-emerald-800 space-y-2">
                <li>✓ Be specific about your question</li>
                <li>✓ Include relevant details</li>
                <li>✓ Mention any deadlines</li>
                <li>✓ Ask one main question per message</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Other Ways to Get Help</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Submit an assignment request</li>
                <li>• Browse research articles</li>
                <li>• Download study materials</li>
                <li>• Book an appointment</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
