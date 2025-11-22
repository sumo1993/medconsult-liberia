'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Eye, CheckCircle, XCircle, Upload, FileText, X, ExternalLink } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

export default function EditResearchPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id;

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
    tags: '',
    status: 'draft',
  });
  const [existingPdf, setExistingPdf] = useState<{ filename: string; size: number } | null>(null);
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [removePdf, setRemovePdf] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/research/${postId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        
        setFormData({
          title: data.post.title || '',
          summary: data.post.summary || '',
          content: data.post.content || '',
          category: data.post.category || '',
          tags: Array.isArray(data.post.tags) ? data.post.tags.join(', ') : '',
          status: data.post.status || 'draft',
        });

        // Set existing PDF info
        if (data.post.pdf_filename) {
          setExistingPdf({
            filename: data.post.pdf_filename,
            size: data.post.pdf_size || 0,
          });
        }
      } else {
        const errorData = await response.json();
        showNotification('error', `Failed to load post: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      showNotification('error', `Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleNewPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showNotification('error', 'Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showNotification('error', 'PDF file must be less than 10MB');
        return;
      }
      setNewPdfFile(file);
      setRemovePdf(false);
    }
  };

  const handleRemoveExistingPdf = () => {
    setRemovePdf(true);
    setExistingPdf(null);
  };

  const handleRemoveNewPdf = () => {
    setNewPdfFile(null);
  };

  const handleViewPdf = () => {
    window.open(`/api/research/${postId}/pdf`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent, publishNow = false) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth-token');
      
      // Prepare PDF data if new file is uploaded
      let pdfData = null;
      let pdfFilename = null;
      let pdfSize = null;
      
      if (newPdfFile) {
        const reader = new FileReader();
        pdfData = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(newPdfFile);
        });
        pdfFilename = newPdfFile.name;
        pdfSize = newPdfFile.size;
      }

      const response = await fetch(`/api/research/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...formData,
          status: publishNow ? 'published' : formData.status,
          pdf_data: pdfData,
          pdf_filename: pdfFilename,
          pdf_size: pdfSize,
          remove_pdf: removePdf,
        }),
      });

      if (response.ok) {
        showNotification('success', publishNow ? 'Research published successfully!' : 'Changes saved successfully!');
        setTimeout(() => router.push('/dashboard/management/research'), 1500);
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to update research post');
      }
    } catch (error) {
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading post...</p>
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
              onClick={() => router.push('/dashboard/management/research')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Research Post</h1>
              <p className="text-sm text-gray-600">Update your research article</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter research title"
            />
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Brief summary of your research"
            />
          </div>

          {/* PDF Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDF Document <span className="text-gray-500">(Optional)</span>
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Upload a PDF file that readers can download (Max 10MB)
            </p>
            
            {/* Existing PDF */}
            {existingPdf && !removePdf && !newPdfFile && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-blue-600" size={32} />
                    <div>
                      <p className="font-medium text-gray-900">{existingPdf.filename}</p>
                      <p className="text-sm text-gray-500">
                        {(existingPdf.size / 1024 / 1024).toFixed(2)} MB • Current file
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleViewPdf}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                      title="View PDF"
                    >
                      <ExternalLink size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveExistingPdf}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove PDF"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* New PDF Upload */}
            {newPdfFile ? (
              <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-emerald-600" size={32} />
                    <div>
                      <p className="font-medium text-gray-900">{newPdfFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(newPdfFile.size / 1024 / 1024).toFixed(2)} MB • New file
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveNewPdf}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove new PDF"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ) : (!existingPdf || removePdf) && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleNewPdfChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="text-gray-400 mb-3" size={48} />
                  <span className="text-sm font-medium text-gray-700 mb-1">
                    Click to upload new PDF
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF up to 10MB
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder="Write your research content here..."
            />
            <p className="text-sm text-gray-500 mt-2">
              {formData.content.replace(/<[^>]*>/g, '').length} characters (excluding HTML tags)
            </p>
          </div>

          {/* Category and Tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select category</option>
                  <option value="Clinical Research">Clinical Research</option>
                  <option value="Public Health">Public Health</option>
                  <option value="Medical Education">Medical Education</option>
                  <option value="Case Studies">Case Studies</option>
                  <option value="Health Policy">Health Policy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Comma separated tags"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition-colors disabled:opacity-50"
              >
                <Eye size={18} />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Now'}</span>
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Modern Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-2xl border-l-4 ${
              notification.type === 'success'
                ? 'bg-white border-emerald-500'
                : 'bg-white border-red-500'
            } transform transition-all duration-300 ease-in-out`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="text-emerald-500 flex-shrink-0" size={24} />
            ) : (
              <XCircle className="text-red-500 flex-shrink-0" size={24} />
            )}
            <div className="flex-1">
              <p className="text-gray-900 font-semibold">{notification.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
