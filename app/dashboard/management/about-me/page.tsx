'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, CheckCircle, XCircle, Upload, Camera, ExternalLink } from 'lucide-react';

export default function AboutMePage() {
  const router = useRouter();
  const [aboutText, setAboutText] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserId(user.id);
    }
    fetchAboutMe();
  }, []);

  const fetchAboutMe = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/about-me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAboutText(data.about_text || '');
        setHasPhoto(data.has_photo || false);
      }
    } catch (error) {
      console.error('Error fetching About Me:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;

    setUploadingPhoto(true);
    try {
      const token = localStorage.getItem('auth-token');
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await fetch('/api/about-me/photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Photo uploaded successfully!' });
        setHasPhoto(true);
        setPhotoFile(null);
        setPhotoPreview(null);
      } else {
        throw new Error('Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setNotification({ type: 'error', message: 'Failed to upload photo' });
    } finally {
      setUploadingPhoto(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSaveText = async () => {
    if (!aboutText.trim()) {
      setNotification({ type: 'error', message: 'Please enter some text' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/about-me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ about_text: aboutText }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'About Me text saved successfully!' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
      setNotification({ type: 'error', message: 'Failed to save About Me text' });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const wordCount = aboutText.trim().split(/\s+/).filter(word => word.length > 0).length;

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
                <h1 className="text-2xl font-bold text-gray-900">About Me</h1>
                <p className="text-sm text-gray-600">Edit your public "About Dr." section</p>
              </div>
            </div>
            <button
              onClick={() => window.open('/doctors', '_blank')}
              className="flex items-center space-x-2 px-4 py-2 border border-emerald-600 text-emerald-700 rounded-md hover:bg-emerald-50"
            >
              <ExternalLink size={18} />
              <span>View Live Page</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Photo Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Camera size={20} className="mr-2" />
              Your Photo
            </h2>
            
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-lg object-cover border-4 border-emerald-500"
                  />
                ) : hasPhoto ? (
                  <img
                    src={`/api/about-me/photo?userId=${userId}&t=${Date.now()}`}
                    alt="Your photo"
                    className="w-32 h-32 rounded-lg object-cover border-4 border-gray-300"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                    <User size={48} className="text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {hasPhoto ? 'Change Photo' : 'Upload Photo'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {photoFile && (
                  <button
                    onClick={handleUploadPhoto}
                    disabled={uploadingPhoto}
                    className="mt-3 flex items-center space-x-2 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:opacity-50"
                  >
                    <Upload size={18} />
                    <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  This photo will appear in the "About Dr." section on the public page
                </p>
              </div>
            </div>
          </div>

          {/* Text Editor Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your About Me Text</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Write about yourself (this will appear as "About Dr. [Your Name]")
              </label>
              <textarea
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                placeholder="Example:

I am a Liberian healthcare professional and a 2002/2003 graduate of the Tubman National Institute of Medical Arts as a Physician Assistant. I obtained my Bachelor of Science degree from the School of Medical Science at the Mother Patern College of Health Sciences. Throughout my career, I have been trained as a trainer of trainers and received specialized training in Uganda as a Malaria expert. I hold numerous certifications from humanitarian organizations including USAID and UNDP.

With over 15 years of working experience in hospitals, clinics, and NGOs, I have dedicated my career to training health workers and community members in collaboration with the National Malaria Control Program. During Liberia's civil war, I worked with MSF-B and established four Internally Displaced Persons camps outside Monrovia. During the Ebola crisis, I served as a trainer for pharmacies and medicine stores in prevention methods. Most recently, I served as a screener at Jallah Medical Center during the COVID-19 pandemic.

As a trained manager, I bring extensive experience in project monitoring and achievement, combining medical expertise with practical knowledge of healthcare delivery in Liberia's unique context."
              />
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{wordCount} words</span>
              <span>{aboutText.length} characters</span>
            </div>

            <button
              onClick={handleSaveText}
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50 font-semibold"
            >
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Save About Me Text'}</span>
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Share your medical background and experience</li>
                <li>• Mention your education and training</li>
                <li>• Highlight your specializations</li>
                <li>• Keep it professional and informative</li>
                <li>• Aim for 150-300 words</li>
              </ul>
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
