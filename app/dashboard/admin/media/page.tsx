'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Upload, Trash2, Edit2, Eye, EyeOff,
  Image as ImageIcon, Video, X, Check, Loader2, Play,
  Search, Filter,
} from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';

interface MediaPost {
  id: number;
  title: string;
  description: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url: string | null;
  posted_by: number;
  author_name: string;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export default function AdminMediaPage() {
  const router = useRouter();
  const { isAuthorized, profile } = useRoleRedirect(['admin', 'management'], '/login');

  const [media, setMedia] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaPost | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch(`/api/media?page=${page}&limit=20`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isAuthorized) fetchMedia();
  }, [isAuthorized, fetchMedia]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFormPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setFormPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!formTitle.trim() || !formFile) return;
    setUploading(true);
    setUploadProgress('Uploading...');
    try {
      const fd = new FormData();
      fd.append('title', formTitle.trim());
      fd.append('description', formDescription.trim());
      fd.append('file', formFile);

      const res = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });

      if (res.ok) {
        setUploadProgress('Upload complete!');
        setShowUploadModal(false);
        resetForm();
        fetchMedia();
      } else {
        const data = await res.json();
        setUploadProgress(`Error: ${data.error || 'Upload failed'}`);
      }
    } catch {
      setUploadProgress('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== id));
        setDeleteConfirm(null);
      }
    } catch {
      // silently fail
    }
  };

  const handleTogglePublish = async (item: MediaPost) => {
    try {
      const res = await fetch(`/api/media/${item.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: item.is_published ? 0 : 1 }),
      });
      if (res.ok) {
        setMedia((prev) =>
          prev.map((m) =>
            m.id === item.id ? { ...m, is_published: item.is_published ? 0 : 1 } : m
          )
        );
      }
    } catch {
      // silently fail
    }
  };

  const handleEditSave = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/media/${editingItem.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingItem.title,
          description: editingItem.description,
        }),
      });
      if (res.ok) {
        setMedia((prev) =>
          prev.map((m) =>
            m.id === editingItem.id
              ? { ...m, title: editingItem.title, description: editingItem.description }
              : m
          )
        );
        setEditingItem(null);
      }
    } catch {
      // silently fail
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormFile(null);
    setFormPreview(null);
    setUploadProgress('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredMedia = media.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || m.media_type === filterType;
    return matchesSearch && matchesType;
  });

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/admin')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">Media Manager</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition shadow-md text-sm font-medium"
            >
              <Upload size={16} />
              Upload Media
            </button>
            <ProfileAvatar
              name={profile?.name}
              profilePhotoId={profile?.id}
              navProfile="/dashboard/admin/profile"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            {(['all', 'image', 'video'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  filterType === type
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 border hover:bg-gray-50'
                }`}
              >
                {type === 'all' ? 'All' : type === 'image' ? 'Images' : 'Videos'}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No media found</p>
            <p className="text-gray-400 text-sm mt-1">Upload photos and videos to share with the public</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
            >
              <Upload size={16} />
              Upload First Media
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition group"
                >
                  {/* Thumbnail */}
                  <div
                    className="relative aspect-video bg-gray-100 cursor-pointer overflow-hidden"
                    onClick={() => setPreviewItem(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setPreviewItem(item)}
                  >
                    {item.media_type === 'video' ? (
                      <>
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Video size={40} className="text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/50 rounded-full p-3">
                            <Play size={24} className="text-white ml-0.5" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <img
                        src={item.media_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    {!item.is_published && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        Draft
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      {item.media_type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                      {item.media_type}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{item.title}</h3>
                    {item.description && (
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTogglePublish(item)}
                          className={`p-1.5 rounded-lg transition ${
                            item.is_published
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={item.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {item.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          onClick={() => setEditingItem({ ...item })}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      page === p
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-gray-600 border hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">Upload Media</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  placeholder="Enter a title for this media"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm resize-none"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formPreview ? (
                    <div className="relative">
                      {formFile?.type.startsWith('video/') ? (
                        <video
                          src={formPreview}
                          className="max-h-48 mx-auto rounded-lg"
                          controls={false}
                          muted
                        />
                      ) : (
                        <img
                          src={formPreview}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded-lg object-contain"
                        />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetForm();
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 font-medium">
                        Click to select a photo or video
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPEG, PNG, GIF, WebP, MP4, WebM, MOV (max 100MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {uploadProgress && (
                <p className={`text-sm font-medium ${uploadProgress.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {uploadProgress}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !formTitle.trim() || !formFile}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">Edit Media</h2>
              <button onClick={() => setEditingItem(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                <Check size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="font-bold text-gray-800">{previewItem.title}</h2>
                {previewItem.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{previewItem.description}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="bg-black flex items-center justify-center overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {previewItem.media_type === 'video' ? (
                <video
                  src={previewItem.media_url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                />
              ) : (
                <img
                  src={previewItem.media_url}
                  alt={previewItem.title}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <Trash2 size={32} className="mx-auto text-red-500 mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Media?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
