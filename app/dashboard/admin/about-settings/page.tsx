'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, User, Eye, CheckCircle, AlertCircle, Image as ImageIcon, Trash2 } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import PaginationControls from '@/components/PaginationControls';

interface Doctor {
  id: number;
  full_name: string;
  email: string;
  about_text: string;
  status: string;
  has_about_photo: boolean;
}

export default function AboutSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const [formData, setFormData] = useState({
    full_name: '',
    status: '',
    about_text: '',
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors/public');
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
        
        // Auto-select the first doctor with about_text
        const doctorWithAbout = data.doctors.find((d: Doctor) => d.about_text);
        if (doctorWithAbout) {
          selectDoctor(doctorWithAbout);
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectDoctor = (doctor: Doctor) => {
    setSelectedDoctorId(doctor.id);
    setFormData({
      full_name: doctor.full_name || '',
      status: doctor.status || '',
      about_text: doctor.about_text || '',
    });
    if (doctor.has_about_photo) {
      setPreviewImage(`/api/about-me/photo?userId=${doctor.id}&t=${Date.now()}`);
    } else {
      setPreviewImage(null);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctorId) {
      showNotification('error', 'Please select a doctor first');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token');
      
      // Save the about text and profile info
      const response = await fetch('/api/admin/about-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: selectedDoctorId,
          ...formData,
        }),
      });

      if (response.ok) {
        showNotification('success', 'About section updated successfully!');
        fetchDoctors(); // Refresh data
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to save');
      }
    } catch (error) {
      showNotification('error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDoctorId) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const token = localStorage.getItem('auth-token');
        
        const response = await fetch('/api/admin/about-settings/photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            userId: selectedDoctorId,
            photo_data: base64String,
            photo_type: file.type,
          }),
        });

        if (response.ok) {
          showNotification('success', 'Photo uploaded successfully!');
          setPreviewImage(`/api/about-me/photo?userId=${selectedDoctorId}&t=${Date.now()}`);
          fetchDoctors();
        } else {
          const data = await response.json();
          showNotification('error', data.error || 'Failed to upload photo');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showNotification('error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedDoctorId) return;
    
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/about-settings/photo?userId=${selectedDoctorId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        showNotification('success', 'Photo deleted successfully!');
        setPreviewImage(null);
        fetchDoctors();
      } else {
        showNotification('error', 'Failed to delete photo');
      }
    } catch (error) {
      showNotification('error', 'Failed to delete photo');
    }
  };

  const sortedDoctors = [...doctors].sort((a, b) => b.id - a.id);
  const totalPages = Math.max(1, Math.ceil(sortedDoctors.length / itemsPerPage));
  const paginatedDoctors = sortedDoctors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [doctors]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/dashboard/admin')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">About Section Settings</h1>
                <p className="text-sm text-gray-600">Edit the homepage "About" section</p>
              </div>
            </div>
            <ProfileAvatar onClick={() => router.push('/dashboard/admin/profile')} />
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {notification.message}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Select Doctor */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="text-emerald-600" size={20} />
                Select Person to Feature
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {paginatedDoctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => selectDoctor(doctor)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedDoctorId === doctor.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{doctor.full_name || 'No name'}</p>
                    <p className="text-sm text-gray-600">{doctor.email}</p>
                    {doctor.about_text && (
                      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Has About Text
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {sortedDoctors.length > 0 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>

            {/* Edit Form */}
            {selectedDoctorId && (
              <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Content</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="e.g., Isaac B. Zeah"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title/Status (shown below name)
                    </label>
                    <input
                      type="text"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      placeholder="e.g., Certified Physician Assistant"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      About Text
                    </label>
                    <textarea
                      value={formData.about_text}
                      onChange={(e) => setFormData({ ...formData, about_text: e.target.value })}
                      placeholder="Write the biography/about text here..."
                      rows={10}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.about_text.length} characters
                    </p>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photo
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {previewImage ? (
                          <img src={previewImage} alt="About photo" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon size={32} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <Upload size={18} />
                          {uploading ? 'Uploading...' : 'Upload Photo'}
                        </button>
                        {previewImage && (
                          <button
                            type="button"
                            onClick={handleDeletePhoto}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
                          >
                            <Trash2 size={18} />
                            Delete Photo
                          </button>
                        )}
                        <p className="text-xs text-gray-500">
                          Recommended: Square image, at least 400x400px
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? 'Saving...' : <><Save size={20} /> Save Changes</>}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="text-emerald-600" size={20} />
                Preview
              </h2>
              
              {selectedDoctorId ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  {/* Preview Image */}
                  <div className="rounded-lg overflow-hidden bg-gray-200 mb-4">
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="w-full h-auto" />
                    ) : (
                      <div className="aspect-square flex items-center justify-center text-gray-400">
                        <ImageIcon size={48} />
                      </div>
                    )}
                  </div>
                  
                  {/* Preview Text */}
                  <h3 className="text-xl font-bold text-emerald-700 text-center mb-1">
                    About {formData.full_name || 'Name'}
                  </h3>
                  {formData.status && (
                    <p className="text-sm text-emerald-600 font-semibold text-center mb-3">
                      {formData.status}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 line-clamp-6">
                    {formData.about_text || 'About text will appear here...'}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                  <User size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>Select a person to preview</p>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Tip:</strong> This content will be displayed in the "About" section on the homepage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

