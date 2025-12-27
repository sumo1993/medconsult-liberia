'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import {
  MessageSquareQuote,
  Plus,
  Edit2,
  Trash2,
  Star,
  Upload,
  X,
  Eye,
  EyeOff,
  User,
  ArrowUp,
  ArrowDown,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  rating: number;
  text: string;
  is_active: boolean;
  display_order: number;
  has_photo: boolean;
  created_at: string;
}

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const { isLoadingRole } = useRoleRedirect('admin');
  
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    rating: 5,
    text: '',
    display_order: 0
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTestimonials = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/testimonials', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      
      const data = await response.json();
      setTestimonials(data.testimonials || []);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingRole) {
      fetchTestimonials();
    }
  }, [isLoadingRole]);

  const openModal = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        name: testimonial.name,
        role: testimonial.role,
        rating: testimonial.rating,
        text: testimonial.text,
        display_order: testimonial.display_order
      });
      if (testimonial.has_photo) {
        setPhotoPreview(`/api/admin/testimonials/${testimonial.id}/photo?t=${Date.now()}`);
      }
    } else {
      setEditingTestimonial(null);
      setFormData({
        name: '',
        role: '',
        rating: 5,
        text: '',
        display_order: testimonials.length
      });
      setPhotoPreview(null);
    }
    setSelectedPhoto(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTestimonial(null);
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setFormData({
      name: '',
      role: '',
      rating: 5,
      text: '',
      display_order: 0
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('auth-token');
      
      let testimonialId = editingTestimonial?.id;
      
      // Create or update testimonial
      if (editingTestimonial) {
        const response = await fetch(`/api/admin/testimonials/${editingTestimonial.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to update testimonial');
      } else {
        const response = await fetch('/api/admin/testimonials', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to create testimonial');
        
        const data = await response.json();
        testimonialId = data.id;
      }
      
      // Upload photo if selected
      if (selectedPhoto && testimonialId) {
        const photoFormData = new FormData();
        photoFormData.append('photo', selectedPhoto);
        
        const photoResponse = await fetch(`/api/admin/testimonials/${testimonialId}/photo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: photoFormData
        });
        
        if (!photoResponse.ok) throw new Error('Failed to upload photo');
      }
      
      setSuccess(editingTestimonial ? 'Testimonial updated successfully!' : 'Testimonial created successfully!');
      closeModal();
      fetchTestimonials();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete testimonial');
      
      setSuccess('Testimonial deleted successfully!');
      fetchTestimonials();
    } catch (err) {
      setError('Failed to delete testimonial');
    }
  };

  const toggleActive = async (testimonial: Testimonial) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/testimonials/${testimonial.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !testimonial.is_active })
      });
      
      if (!response.ok) throw new Error('Failed to update testimonial');
      
      fetchTestimonials();
    } catch (err) {
      setError('Failed to update testimonial status');
    }
  };

  const moveTestimonial = async (testimonial: Testimonial, direction: 'up' | 'down') => {
    const currentIndex = testimonials.findIndex(t => t.id === testimonial.id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (swapIndex < 0 || swapIndex >= testimonials.length) return;
    
    const token = localStorage.getItem('auth-token');
    
    try {
      // Swap display orders
      await Promise.all([
        fetch(`/api/admin/testimonials/${testimonial.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ display_order: testimonials[swapIndex].display_order })
        }),
        fetch(`/api/admin/testimonials/${testimonials[swapIndex].id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ display_order: testimonial.display_order })
        })
      ]);
      
      fetchTestimonials();
    } catch (err) {
      setError('Failed to reorder testimonials');
    }
  };

  const removePhoto = async () => {
    if (!editingTestimonial) return;
    
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/testimonials/${editingTestimonial.id}/photo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to remove photo');
      
      setPhotoPreview(null);
      setSuccess('Photo removed successfully!');
      fetchTestimonials();
    } catch (err) {
      setError('Failed to remove photo');
    }
  };

  if (isLoadingRole || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Testimonials</h1>
                <p className="text-sm text-gray-500">Add, edit, and manage client testimonials</p>
              </div>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus size={20} />
              Add Testimonial
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={20} /></button>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess('')}><X size={20} /></button>
          </div>
        )}

        {/* Testimonials Grid */}
        {testimonials.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <MessageSquareQuote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Testimonials Yet</h3>
            <p className="text-gray-500 mb-6">Add your first testimonial to showcase client feedback</p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus size={20} />
              Add First Testimonial
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`bg-white rounded-xl shadow-sm p-6 ${!testimonial.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-6">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    {testimonial.has_photo ? (
                      <img
                        src={`/api/admin/testimonials/${testimonial.id}/photo?t=${Date.now()}`}
                        alt={testimonial.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-emerald-100"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="w-10 h-10 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{testimonial.name}</h3>
                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                        <div className="flex gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        testimonial.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {testimonial.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    
                    <p className="mt-3 text-gray-700 italic">"{testimonial.text}"</p>
                    
                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => moveTestimonial(testimonial, 'up')}
                        disabled={index === 0}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <ArrowUp size={18} />
                      </button>
                      <button
                        onClick={() => moveTestimonial(testimonial, 'down')}
                        disabled={index === testimonials.length - 1}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <ArrowDown size={18} />
                      </button>
                      <button
                        onClick={() => toggleActive(testimonial)}
                        className={`p-2 rounded-lg transition-colors ${
                          testimonial.is_active
                            ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                            : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={testimonial.is_active ? 'Hide' : 'Show'}
                      >
                        {testimonial.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => openModal(testimonial)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(testimonial.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-emerald-50 bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="w-12 h-12 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Upload size={18} />
                      Upload Photo
                    </button>
                    {photoPreview && editingTestimonial?.has_photo && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={18} />
                        Remove Photo
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., John Doe"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Role/Title *
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Research Client, Corporate Partner"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating })}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Star
                        size={28}
                        className={rating <= formData.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Testimonial Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Testimonial Text *
                </label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  placeholder="Enter the client's testimonial..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {saving ? 'Saving...' : (editingTestimonial ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


