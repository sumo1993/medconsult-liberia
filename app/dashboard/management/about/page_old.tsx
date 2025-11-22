'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, User, CheckCircle, XCircle } from 'lucide-react';

export default function AboutDrEditPage() {
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // Get user ID
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserId(user.id);
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/profile', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setBio(data.bio || '');
        setFullName(data.full_name || '');
        setStatus(data.status || '');
        setSpecialization(data.specialization || '');
        setYearsOfExperience(data.years_of_experience?.toString() || '');
        setHasPhoto(data.has_profile_photo || false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ bio }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'About Dr. section updated successfully!' });
        setTimeout(() => setNotification(null), 3000);
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error saving:', error);
      setNotification({ type: 'error', message: 'Failed to update About Dr. section' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const wordCount = bio.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = bio.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/management')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">About Dr. Section</h1>
                <p className="text-sm text-gray-600">Manage your public biography</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                <Eye size={18} />
                <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:opacity-50"
              >
                <Save size={18} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Your Biography</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About Dr. {fullName?.split(' ')[0] || 'You'}
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                placeholder="Write your professional biography here...

Example:
With over 20 years of medical experience, I have dedicated my career to improving healthcare in Liberia through clinical practice, research, and public health initiatives.

My work with various NGOs and government projects has provided me with unique insights into the healthcare challenges facing our communities and effective strategies to address them.

I have established and managed multiple clinics throughout Liberia, combining medical expertise with practical knowledge of healthcare delivery in our specific context."
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Writing Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Share your medical experience and expertise</li>
                <li>• Mention your approach to patient care</li>
                <li>• Highlight your specializations and achievements</li>
                <li>• Keep it professional yet personable</li>
                <li>• Aim for 150-300 words for best impact</li>
              </ul>
            </div>
          </div>

          {/* Preview */}
          <div className={`bg-white rounded-lg shadow p-6 ${showPreview ? '' : 'hidden lg:block'}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {/* Doctor Card Preview */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-t-lg h-32 flex items-center justify-center mb-4">
                {hasPhoto ? (
                  <img
                    src={`/api/profile/photo?userId=${userId}`}
                    alt={fullName}
                    className="w-24 h-24 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-white flex items-center justify-center">
                    <User size={48} className="text-emerald-700" />
                  </div>
                )}
              </div>

              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {fullName || 'Your Name'}
                </h3>
                <p className="text-emerald-600 font-medium">
                  {status || 'Medical Professional'}
                </p>
              </div>

              {specialization && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 uppercase">Specialization</p>
                  <p className="text-sm text-gray-900">{specialization}</p>
                </div>
              )}

              {yearsOfExperience && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase">Experience</p>
                  <p className="text-sm text-gray-900">{yearsOfExperience} years</p>
                </div>
              )}

              <div className="border-t pt-4 mb-4">
                <h4 className="text-sm font-semibold text-emerald-700 mb-2">
                  About Dr. {fullName?.split(' ')[0] || 'You'}
                </h4>
                {bio ? (
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {bio.length > 200 ? bio.substring(0, 200) + '...' : bio}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Your biography will appear here...
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button 
                  className="flex-1 px-4 py-2 bg-emerald-700 text-white text-sm rounded-lg opacity-50 cursor-not-allowed"
                  title="Preview only - not functional"
                >
                  Read Full Biography
                </button>
                <button 
                  className="flex-1 px-4 py-2 border-2 border-emerald-700 text-emerald-700 text-sm rounded-lg opacity-50 cursor-not-allowed"
                  title="Preview only - not functional"
                >
                  Contact Me
                </button>
              </div>
            </div>

            <div className="mt-4 text-center space-y-2">
              <p className="text-xs text-gray-500">
                This is how your About section will appear on the public doctors page
              </p>
              <button
                onClick={() => window.open('/doctors', '_blank')}
                className="text-sm text-emerald-700 hover:text-emerald-800 font-medium underline"
              >
                View Live Public Page →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg border-l-4 ${
              notification.type === 'success'
                ? 'bg-white border-green-500'
                : 'bg-white border-red-500'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <XCircle className="text-red-500" size={24} />
            )}
            <span className="text-gray-900 font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
