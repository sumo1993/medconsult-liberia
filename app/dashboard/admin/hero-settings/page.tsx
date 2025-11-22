'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Image as ImageIcon, X, Trash2, Plus, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface HeroImage {
  id?: number;
  url: string;
  order: number;
  is_active?: boolean;
}

export default function HeroSettingsPage() {
  const router = useRouter();
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [currentPreview, setCurrentPreview] = useState(0);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: number | null }>({ show: false, id: null });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchHeroImages();
  }, []);

  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentPreview((prev) => (prev + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  const fetchHeroImages = async () => {
    try {
      const response = await fetch('/api/admin/hero-images', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setHeroImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching hero images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'Image size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/upload-hero', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        await fetchHeroImages();
        setSelectedFile(null);
        showNotification('success', 'Hero image uploaded successfully!');
      } else {
        const error = await response.json();
        showNotification('error', error.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showNotification('error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = async () => {
    if (!newImageUrl.trim()) {
      showNotification('error', 'Please enter an image URL');
      return;
    }

    try {
      const response = await fetch('/api/admin/hero-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: newImageUrl }),
      });

      if (response.ok) {
        await fetchHeroImages();
        setNewImageUrl('');
        showNotification('success', 'Hero image added successfully!');
      } else {
        showNotification('error', 'Failed to add image');
      }
    } catch (error) {
      showNotification('error', 'Failed to add image');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    try {
      console.log('[Delete] Attempting to delete image ID:', deleteModal.id);
      
      const response = await fetch(`/api/admin/hero-images/${deleteModal.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      console.log('[Delete] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Delete] Success:', data);
        await fetchHeroImages();
        setCurrentPreview(0);
        setDeleteModal({ show: false, id: null });
        showNotification('success', 'Image deleted successfully!');
      } else {
        const errorData = await response.json();
        console.error('[Delete] Error:', errorData);
        showNotification('error', errorData.error || 'Failed to delete image');
        setDeleteModal({ show: false, id: null });
      }
    } catch (error) {
      console.error('[Delete] Exception:', error);
      showNotification('error', 'Failed to delete image. Please try again.');
      setDeleteModal({ show: false, id: null });
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/hero-images/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchHeroImages();
        showNotification('success', 'Image status updated!');
      } else {
        showNotification('error', 'Failed to update image status');
      }
    } catch (error) {
      console.error('[Toggle] Error:', error);
      showNotification('error', 'Failed to update image status');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const nextPreview = () => {
    setCurrentPreview((prev) => (prev + 1) % heroImages.length);
  };

  const prevPreview = () => {
    setCurrentPreview((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <ImageIcon className="text-emerald-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Hero Images Slideshow</h1>
          </div>
          <p className="text-gray-600">
            Add multiple images for the hero section slideshow
          </p>
        </div>

        {/* Image Guidelines */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Image Guidelines</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">For best results, use images with these specifications:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Recommended Size:</strong> 1350x900 pixels (3:2 ratio)</li>
                  <li><strong>Display Heights:</strong> Mobile: 600px, Tablet: 700px, Desktop: 900px</li>
                  <li><strong>Format:</strong> JPG, PNG, or WebP</li>
                  <li><strong>File Size:</strong> Maximum 5MB</li>
                  <li><strong>Quality:</strong> High resolution for best appearance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Preview ({heroImages.length} {heroImages.length === 1 ? 'image' : 'images'})
          </h2>
          
          {heroImages.length > 0 ? (
            <div className="relative w-full h-96 rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={heroImages[currentPreview]?.url}
                alt="Hero preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-4xl font-bold text-emerald-700 mb-2">
                    Expert Medical Consultation
                  </h3>
                  <p className="text-gray-600">Preview</p>
                </div>
              </div>

              {heroImages.length > 1 && (
                <>
                  <button
                    onClick={prevPreview}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextPreview}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {heroImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPreview(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === currentPreview ? 'bg-emerald-600' : 'bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-96 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ImageIcon size={64} className="mx-auto mb-4 opacity-50" />
                <p>No images yet. Add one below!</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Plus size={20} className="mr-2" />
            Add New Image
          </h2>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
              <input
                type="file"
                id="hero-upload"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="hero-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="text-gray-400 mb-3" size={48} />
                <p className="text-gray-700 font-medium mb-1">Click to upload</p>
                <p className="text-sm text-gray-500">PNG, JPG, WEBP up to 5MB</p>
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ImageIcon className="text-emerald-600" size={24} />
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button onClick={() => setSelectedFile(null)} className="p-2 text-gray-600">
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or add from URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleAddUrl}
                  disabled={!newImageUrl.trim()}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            All Images ({heroImages.length})
          </h2>
          
          {heroImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {heroImages.map((image, index) => (
                <div
                  key={image.id || index}
                  className={`relative group rounded-lg overflow-hidden border-2 ${
                    image.is_active === false ? 'border-gray-400 opacity-60' : 'border-gray-200'
                  }`}
                >
                  <img src={image.url} alt={`Hero ${index + 1}`} className="w-full h-48 object-cover" />
                  
                  {/* Hover Controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => image.id && handleToggleActive(image.id)}
                      className={`px-4 py-2 ${
                        image.is_active === false ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
                      } text-white rounded-md flex items-center space-x-2`}
                      title={image.is_active === false ? 'Activate' : 'Deactivate'}
                    >
                      {image.is_active === false ? <Eye size={16} /> : <EyeOff size={16} />}
                      <span>{image.is_active === false ? 'Show' : 'Hide'}</span>
                    </button>
                    <button
                      onClick={() => image.id && setDeleteModal({ show: true, id: image.id })}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                  
                  {/* Order Badge */}
                  <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-1 rounded text-sm">
                    #{index + 1}
                  </div>
                  
                  {/* Active/Inactive Badge */}
                  <div className={`absolute top-2 right-2 ${
                    image.is_active === false ? 'bg-gray-600' : 'bg-green-600'
                  } text-white px-2 py-1 rounded text-xs flex items-center space-x-1`}>
                    {image.is_active === false ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{image.is_active === false ? 'Hidden' : 'Active'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No images yet. Add one above!</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Trash2 className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">Delete Hero Image</h3>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-gray-700 text-lg mb-2">
                Are you sure you want to delete this image?
              </p>
              <p className="text-gray-500 text-sm">
                This action cannot be undone. The image will be permanently removed from the hero slideshow.
              </p>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ show: false, id: null })}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors flex items-center space-x-2"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
