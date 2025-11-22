'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, X, Send, CheckCircle, XCircle } from 'lucide-react';

export default function RequestAssignmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    deadline: '',
    priority: 'medium',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth-token');
      
      // Convert first file to base64 if exists
      let attachment_data = null;
      let attachment_filename = null;
      
      if (files.length > 0) {
        const file = files[0]; // Take first file only
        const reader = new FileReader();
        
        attachment_data = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        attachment_filename = file.name;
      }
      
      const response = await fetch('/api/assignment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          deadline: formData.deadline || null,
          attachment_data,
          attachment_filename,
        }),
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Assignment request submitted successfully! Redirecting...',
        });
        setTimeout(() => {
          router.push('/dashboard/client/assignments');
        }, 2000);
      } else {
        const data = await response.json();
        setNotification({
          type: 'error',
          message: data.error || 'Failed to submit assignment request',
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
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
              <h1 className="text-2xl font-bold text-gray-900">Request Assignment Help</h1>
              <p className="text-sm text-gray-600">Submit your assignment for review and assistance</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Research Paper on Malaria Treatment"
            />
          </div>

          {/* Subject */}
          <div className="mb-6">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject/Category *
            </label>
            <select
              id="subject"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select a subject...</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Public Health">Public Health</option>
              <option value="Clinical Research">Clinical Research</option>
              <option value="Infectious Diseases">Infectious Diseases</option>
              <option value="Chronic Diseases">Chronic Diseases</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Nursing">Nursing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              rows={6}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Describe your assignment, what help you need, specific questions, etc..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Be as detailed as possible to help the doctor understand your needs
            </p>
          </div>

          {/* Deadline and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                Deadline (Optional)
              </label>
              <input
                type="date"
                id="deadline"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="low">Low - No rush</option>
                <option value="medium">Medium - Normal</option>
                <option value="high">High - Important</option>
                <option value="urgent">Urgent - ASAP</option>
              </select>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attach Files (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
              <Upload className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="text-sm text-gray-600 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mb-4">
                PDF, DOC, DOCX, PPT, XLS, Images (Max 10MB each)
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 cursor-pointer"
              >
                Choose Files
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText size={20} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/dashboard/client')}
              className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold text-lg transition-all shadow-sm hover:shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-semibold text-lg transition-all shadow-md hover:shadow-lg"
            >
              <Send size={20} />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📋 What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ <strong>Step 1:</strong> Consultant reviews your request</li>
            <li>✓ <strong>Step 2:</strong> Consultant proposes price for the work</li>
            <li>✓ <strong>Step 3:</strong> You can accept, negotiate, or reject</li>
            <li>✓ <strong>Step 4:</strong> Make payment and upload receipt</li>
            <li>✓ <strong>Step 5:</strong> Consultant verifies payment and starts work</li>
            <li>✓ <strong>Step 6:</strong> Receive completed assignment</li>
          </ul>
          <p className="mt-3 text-xs text-blue-700 italic">
            💡 Tip: Be detailed in your description to get accurate pricing
          </p>
        </div>
      </main>

      {/* Modern Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-2xl border-l-4 ${
              notification.type === 'success'
                ? 'bg-white border-green-500'
                : 'bg-white border-red-500'
            }`}
            style={{
              animation: 'slideIn 0.3s ease-out',
              minWidth: '320px',
              maxWidth: '500px',
            }}
          >
            {notification.type === 'success' ? (
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            ) : (
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="text-red-600" size={24} />
              </div>
            )}
            <div className="flex-1">
              <h4
                className={`font-semibold ${
                  notification.type === 'success' ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {notification.type === 'success' ? 'Success!' : 'Error'}
              </h4>
              <p
                className={`text-sm ${
                  notification.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
