'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, CheckCircle, XCircle, Upload, FileText, X } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUpload from '@/components/ImageUpload';
import { useAutoSave } from '@/hooks/useAutoSave';
import AutoSaveIndicator from '@/components/AutoSaveIndicator';

export default function CreateResearchPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
    tags: '',
    status: 'draft',
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [featuredImage, setFeaturedImage] = useState<{ file: File | null; preview: string | null }>({
    file: null,
    preview: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('research-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        const draftContent = draft.formData?.content || '';
        
        // Check if draft content is too large (likely has embedded images)
        if (draftContent.length > 500000) {
          const sizeMB = (draftContent.length / 1024 / 1024).toFixed(2);
          console.warn('⚠️ Draft is too large:', sizeMB, 'MB - clearing it');
          localStorage.removeItem('research-draft');
          showNotification('error', `Previous draft was too large (${sizeMB} MB) and has been cleared. Please avoid pasting images into the editor.`);
          return;
        }
        
        const shouldRestore = confirm('Found an unsaved draft. Would you like to restore it?');
        if (shouldRestore) {
          setFormData(draft.formData || formData);
          showNotification('success', 'Draft restored');
        } else {
          localStorage.removeItem('research-draft');
        }
      } catch (error) {
        console.error('Error loading draft:', error);
        localStorage.removeItem('research-draft');
      }
    }
  }, []);

  // Auto-save to localStorage
  const handleAutoSave = useCallback(async (data: any) => {
    localStorage.setItem('research-draft', JSON.stringify({
      formData: data,
      timestamp: new Date().toISOString(),
    }));
  }, []);

  const { isSaving, lastSaved, error: autoSaveError } = useAutoSave({
    data: formData,
    onSave: handleAutoSave,
    delay: 30000, // 30 seconds
    enabled: formData.title.length > 0 || formData.content.length > 0,
  });

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showNotification('error', 'Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showNotification('error', 'PDF file must be less than 10MB');
        return;
      }
      setPdfFile(file);
    }
  };

  const removePdf = () => {
    setPdfFile(null);
  };

  const handleSubmit = async (e: React.FormEvent, publishNow = false) => {
    e.preventDefault();
    
    // Validate content is not empty (excluding HTML tags)
    const plainTextContent = formData.content.replace(/<[^>]*>/g, '').trim();
    if (!plainTextContent) {
      showNotification('error', 'Please add some content to your research post');
      return;
    }

    // Check if content is too large (likely has embedded images)
    if (formData.content.length > 500000) { // 500KB limit for content
      const sizeMB = (formData.content.length / 1024 / 1024).toFixed(2);
      showNotification('error', `Content is too large (${sizeMB} MB). Please avoid pasting images directly into the editor. Use the Featured Image upload instead.`);
      return;
    }
    
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth-token');
      
      // Convert PDF to base64 if present
      let pdfData = null;
      let pdfFilename = null;
      let pdfSize = null;
      
      if (pdfFile) {
        const reader = new FileReader();
        pdfData = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(pdfFile);
        });
        pdfFilename = pdfFile.name;
        pdfSize = pdfFile.size;
      }

      // Convert featured image to base64 if present
      let imageData = null;
      let imageFilename = null;
      let imageSize = null;
      
      if (featuredImage.file) {
        const reader = new FileReader();
        imageData = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(featuredImage.file!);
        });
        imageFilename = featuredImage.file.name;
        imageSize = featuredImage.file.size;
      }

      const payload = {
        ...formData,
        status: publishNow ? 'published' : formData.status,
        pdf_data: pdfData,
        pdf_filename: pdfFilename,
        pdf_size: pdfSize,
        image_data: imageData,
        image_filename: imageFilename,
        image_size: imageSize,
      };

      // Calculate payload size
      const payloadSize = new Blob([JSON.stringify(payload)]).size;
      const payloadSizeMB = (payloadSize / 1024 / 1024).toFixed(2);

      console.log('Submitting research post:', {
        title: payload.title,
        contentLength: payload.content.length,
        hasImage: !!imageData,
        hasPDF: !!pdfData,
        status: payload.status,
        payloadSizeMB: payloadSizeMB + ' MB',
      });

      // Warn if payload is very large
      if (payloadSize > 10 * 1024 * 1024) { // 10MB
        console.warn('⚠️ Large payload detected:', payloadSizeMB, 'MB');
        if (!confirm(`The post data is quite large (${payloadSizeMB} MB). This may take a while to upload. Continue?`)) {
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Clear auto-saved draft on successful submit
        localStorage.removeItem('research-draft');
        showNotification('success', publishNow ? 'Research published successfully!' : 'Draft saved successfully!');
        setTimeout(() => router.push('/dashboard/management/research'), 1500);
      } else {
        const data = await response.json();
        console.error('API Error:', data);
        showNotification('error', data.error || 'Failed to save research post');
      }
    } catch (error) {
      console.error('Submit Error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/management/research')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Research Post</h1>
                <p className="text-sm text-gray-600">Share your research and findings</p>
              </div>
            </div>
            <AutoSaveIndicator 
              isSaving={isSaving}
              lastSaved={lastSaved}
              error={autoSaveError}
            />
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

          {/* Featured Image Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <ImageUpload
              value={featuredImage.preview}
              onChange={(file, preview) => setFeaturedImage({ file, preview })}
              label="Featured Image"
              maxSize={5}
            />
          </div>

          {/* PDF Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDF Document <span className="text-gray-500">(Optional)</span>
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Upload a PDF file that readers can download (Max 10MB)
            </p>
            
            {!pdfFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="text-gray-400 mb-3" size={48} />
                  <span className="text-sm font-medium text-gray-700 mb-1">
                    Click to upload PDF
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF up to 10MB
                  </span>
                </label>
              </div>
            ) : (
              <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="text-emerald-600" size={32} />
                  <div>
                    <p className="font-medium text-gray-900">{pdfFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removePdf}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Remove PDF"
                >
                  <X size={20} />
                </button>
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
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {formData.content.replace(/<[^>]*>/g, '').length} characters (excluding HTML tags)
              </p>
              {formData.content.length > 400000 && (
                <p className="text-sm text-orange-600 font-medium">
                  ⚠️ Content size: {(formData.content.length / 1024).toFixed(0)}KB (approaching limit)
                </p>
              )}
              {formData.content.length > 500000 && (
                <p className="text-sm text-red-600 font-bold">
                  ❌ Content too large! Remove pasted images.
                </p>
              )}
            </div>
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

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                <span>{isSubmitting ? 'Saving...' : 'Save Draft'}</span>
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
