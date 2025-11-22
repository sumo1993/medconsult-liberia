'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Edit, Eye, Mail, Award, Briefcase, Star, ArrowLeft } from 'lucide-react';

interface Researcher {
  id: number;
  full_name: string;
  email: string;
  specialization: string;
  years_of_experience: number;
  bio: string;
  average_rating: number;
  total_ratings: number;
  status: string;
  created_at: string;
  profile_photo_filename: string | null;
}

export default function AdminResearchersPage() {
  const router = useRouter();
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [filteredResearchers, setFilteredResearchers] = useState<Researcher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    specialization: '',
    years_of_experience: 0,
    bio: '',
    profile_photo: null as File | null,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchResearchers();
  }, []);

  useEffect(() => {
    const filtered = researchers.filter(r => 
      r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredResearchers(filtered);
  }, [searchTerm, researchers]);

  const fetchResearchers = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/researchers', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setResearchers(data);
        setFilteredResearchers(data);
      }
    } catch (error) {
      console.error('Error fetching researchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (researcher: Researcher) => {
    setSelectedResearcher(researcher);
    setFormData({
      specialization: researcher.specialization || '',
      years_of_experience: researcher.years_of_experience || 0,
      bio: researcher.bio || '',
      profile_photo: null,
    });
    // Show existing photo if available
    if (researcher.profile_photo_filename) {
      setPhotoPreview(`/api/profile-photo/${researcher.id}?t=${Date.now()}`);
    } else {
      setPhotoPreview(null);
    }
    setShowEditModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, profile_photo: file });
        setPhotoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    if (!selectedResearcher) return;

    console.log('🚀 handleUpdate called');
    console.log('Researcher ID:', selectedResearcher.id);
    console.log('Has photo:', !!formData.profile_photo);

    try {
      const token = localStorage.getItem('auth-token');
      
      // Convert photo to base64 if present
      let photoData = null;
      let photoFilename = null;
      
      if (formData.profile_photo) {
        console.log('Converting photo to base64...');
        const reader = new FileReader();
        photoData = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(formData.profile_photo!);
        });
        photoFilename = formData.profile_photo.name;
        console.log('Photo converted, size:', photoData.length);
      }

      const url = `/api/admin/researchers/${selectedResearcher.id}`;
      console.log('Calling API:', url);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          specialization: formData.specialization,
          years_of_experience: formData.years_of_experience,
          bio: formData.bio,
          profile_photo_data: photoData,
          profile_photo_filename: photoFilename,
        })
      });

      console.log('Response:', response.status, response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Success:', result);
        setToast({ message: 'Researcher profile updated successfully!', type: 'success' });
        setTimeout(() => setToast(null), 3000);
        setShowEditModal(false);
        fetchResearchers();
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        setToast({ 
          message: `Failed to update: ${errorData.details || errorData.error || 'Unknown error'}`, 
          type: 'error' 
        });
        setTimeout(() => setToast(null), 5000);
      }
    } catch (error: any) {
      console.error('❌ Exception:', error);
      setToast({ 
        message: error.message || 'Failed to update researcher profile', 
        type: 'error' 
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading researchers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/management')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Researchers</h1>
                <p className="text-sm text-gray-600">Update researcher profiles for public display</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/our-team')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Eye size={20} />
              View Public Page
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-emerald-600 mb-2">{researchers.length}</div>
            <div className="text-gray-600">Total Researchers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {researchers.filter(r => r.status === 'active').length}
            </div>
            <div className="text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {researchers.filter(r => r.average_rating >= 4.5).length}
            </div>
            <div className="text-gray-600">Highly Rated (4.5+)</div>
          </div>
        </div>

        {/* Researchers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Researcher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResearchers.map((researcher) => (
                  <tr key={researcher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {researcher.profile_photo_filename ? (
                            <img
                              src={`/api/profile-photo/${researcher.id}?t=${Date.now()}`}
                              alt={researcher.full_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <span className="text-emerald-600 font-semibold">
                                {researcher.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{researcher.full_name}</div>
                          <div className="text-sm text-gray-500">{researcher.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-emerald-600" />
                        <span className="text-sm text-gray-900">
                          {researcher.specialization || 'Not set'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {researcher.years_of_experience || 0} years
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-gray-900">
                          {researcher.average_rating ? Number(researcher.average_rating).toFixed(1) : '0.0'} ({researcher.total_ratings || 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        researcher.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {researcher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(researcher)}
                        className="text-emerald-600 hover:text-emerald-900 flex items-center gap-1"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredResearchers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No researchers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedResearcher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Edit Researcher Profile
              </h2>
              <p className="text-gray-600 mb-6">
                Update {selectedResearcher.full_name}'s public profile information
              </p>

              <div className="space-y-4">
                {/* Profile Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-white">
                          {selectedResearcher.full_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-emerald-50 file:text-emerald-700
                          hover:file:bg-emerald-100
                          cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Upload a professional photo (JPG, PNG, max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g., Public Health, Epidemiology, Clinical Research"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    value={formData.years_of_experience}
                    onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio / Description *
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={6}
                    placeholder="Write a brief professional bio that will appear on the public team page..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.bio.length} characters
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
                >
                  Update Profile
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg shadow-lg p-4 flex items-center gap-3 ${
            toast.type === 'success' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
