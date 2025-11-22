'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Lock, Save, Eye, EyeOff, User, MapPin, GraduationCap, Briefcase, Phone } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface ProfileData {
  full_name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  city: string;
  county: string;
  educational_level: string;
  marital_status: string;
  employment_status: string;
  occupation: string;
  phone_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

export default function ClientProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email: '',
    date_of_birth: '',
    gender: '',
    city: '',
    county: '',
    educational_level: '',
    marital_status: '',
    employment_status: '',
    occupation: '',
    phone_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      console.log('[Client Profile] Fetching profile data...');
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/profile', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      console.log('[Client Profile] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Client Profile] Data received:', {
          full_name: data.full_name,
          city: data.city,
          phone_number: data.phone_number,
          email: data.email
        });
        
        // Format date of birth properly for input field (YYYY-MM-DD)
        let formattedDate = '';
        if (data.date_of_birth) {
          const date = new Date(data.date_of_birth);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        }
        
        const newProfileData = {
          full_name: data.full_name || '',
          email: data.email || '',
          date_of_birth: formattedDate,
          gender: data.gender || '',
          city: data.city || '',
          county: data.county || '',
          educational_level: data.educational_level || '',
          marital_status: data.marital_status || '',
          employment_status: data.employment_status || '',
          occupation: data.occupation || '',
          phone_number: data.phone_number || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          emergency_contact_relationship: data.emergency_contact_relationship || '',
        };
        
        console.log('[Client Profile] Setting profile data:', newProfileData);
        setProfileData(newProfileData);
      } else {
        console.error('[Client Profile] Failed to fetch profile:', response.status);
      }
    } catch (error) {
      console.error('[Client Profile] Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const token = localStorage.getItem('auth-token');
        const response = await fetch('/api/profile/update-photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            profile_photo_data: base64String,
            filename: file.name,
          }),
        });

        if (response.ok) {
          showNotification('success', 'Profile photo updated successfully!');
          setTimeout(() => window.location.reload(), 1000);
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('[Client Profile] Saving profile data:', profileData);
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(profileData),
      });

      console.log('[Client Profile] Save response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('[Client Profile] Save successful:', result);
        showNotification('success', 'Profile updated successfully!');
        // Refresh profile data to confirm save
        await fetchProfile();
      } else {
        const data = await response.json();
        console.error('[Client Profile] Save failed:', data);
        showNotification('error', data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('[Client Profile] Save error:', error);
      showNotification('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showNotification('error', 'Password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('success', 'Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showNotification('error', data.error || 'Failed to change password');
      }
    } catch (error) {
      showNotification('error', 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(''); // Clear previous errors

    if (!newEmail || !emailPassword) {
      setEmailError('Please enter new email and password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (newEmail === profileData.email) {
      setEmailError('New email must be different from current email');
      return;
    }

    setChangingEmail(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/profile/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          newEmail: newEmail,
          password: emailPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('success', 'Email changed successfully! Please login with your new email.');
        // Logout after 2 seconds
        setTimeout(() => {
          localStorage.removeItem('auth-token');
          localStorage.removeItem('user');
          router.push('/login');
        }, 2000);
      } else {
        console.error('[Email Change Error]', data);
        const errorMsg = data.error || 'Failed to change email';
        setEmailError(errorMsg);
      }
    } catch (error) {
      console.error('[Email Change Exception]', error);
      setEmailError('Network error. Please try again.');
    } finally {
      setChangingEmail(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getBirthdayMessage = (birthDate: string): { message: string; type: 'birthday' | 'pre-birthday' | null } => {
    if (!birthDate) return { message: '', type: null };
    
    const today = new Date();
    const birth = new Date(birthDate);
    const currentYear = today.getFullYear();
    
    // Set birthday for current year
    const thisYearBirthday = new Date(currentYear, birth.getMonth(), birth.getDate());
    
    // Calculate days until birthday
    const timeDiff = thisYearBirthday.getTime() - today.getTime();
    const daysUntilBirthday = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Check if today is birthday
    if (today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth()) {
      const age = calculateAge(birthDate);
      return { 
        message: `🎉 Happy Birthday! You are ${age} years old today! 🎂`, 
        type: 'birthday' 
      };
    }
    
    // Check if within 30 days (1 month) before birthday
    if (daysUntilBirthday > 0 && daysUntilBirthday <= 30) {
      return { 
        message: `🎈 Happy Pre-Birthday! Your birthday is in ${daysUntilBirthday} day${daysUntilBirthday > 1 ? 's' : ''}! 🎊`, 
        type: 'pre-birthday' 
      };
    }
    
    return { message: '', type: null };
  };

  const age = calculateAge(profileData.date_of_birth);
  const birthdayInfo = getBirthdayMessage(profileData.date_of_birth);

  const liberianCounties = [
    'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
    'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
    'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
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
              onClick={() => router.push('/dashboard/client')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-600">Manage your personal information and account settings</p>
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-md shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Birthday Banner */}
        {birthdayInfo.type && (
          <div className={`mb-6 rounded-lg shadow-lg p-6 text-center ${
            birthdayInfo.type === 'birthday' 
              ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' 
              : 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400'
          }`}>
            <p className="text-2xl md:text-3xl font-bold text-white animate-pulse">
              {birthdayInfo.message}
            </p>
            {birthdayInfo.type === 'birthday' && (
              <p className="text-white mt-2 text-lg">
                Wishing you a wonderful day filled with joy and happiness! 🎁
              </p>
            )}
          </div>
        )}

        {/* Profile Photo Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Camera className="mr-2 text-emerald-700" size={24} />
            Profile Photo
          </h2>
          <div className="flex items-center space-x-6">
            <ProfileAvatar size="lg" />
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-4">
                Upload a new profile photo. The photo will be displayed in your dashboard header.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:bg-gray-400"
              >
                <Camera size={18} className="mr-2" />
                {uploading ? 'Uploading...' : 'Upload New Photo'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Max size: 5MB. Supported formats: JPG, PNG, GIF
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information Form */}
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <User className="mr-2 text-emerald-700" size={24} />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address (Login Name)
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmail(true);
                      setNewEmail(profileData.email);
                      setEmailPassword('');
                      setEmailError('');
                      setShowEmailPassword(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Change Email
                  </button>
                </div>
                <p className="text-xs text-emerald-600 mt-1 font-medium">
                  ℹ️ This email is your login name for the system
                </p>
                <p className="text-xs text-gray-500 mt-1">Click "Change Email" to update your login email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={profileData.date_of_birth}
                  onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {age !== null && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                      🎂 Age: {age} years old
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone_number}
                  onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="+231-XXX-XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marital Status
                </label>
                <select
                  value={profileData.marital_status}
                  onChange={(e) => setProfileData({ ...profileData, marital_status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select marital status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <MapPin className="mr-2 text-emerald-700" size={24} />
              Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County
                </label>
                <select
                  value={profileData.county}
                  onChange={(e) => setProfileData({ ...profileData, county: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select county</option>
                  {liberianCounties.map((county) => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City/Town
                </label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter your city or town"
                />
              </div>
            </div>
          </div>

          {/* Education & Employment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <GraduationCap className="mr-2 text-emerald-700" size={24} />
              Education & Employment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Educational Level
                </label>
                <select
                  value={profileData.educational_level}
                  onChange={(e) => setProfileData({ ...profileData, educational_level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select educational level</option>
                  <option value="no_formal_education">No Formal Education</option>
                  <option value="primary">Primary School</option>
                  <option value="junior_high">Junior High School</option>
                  <option value="senior_high">Senior High School</option>
                  <option value="vocational">Vocational/Technical Training</option>
                  <option value="associate_degree">Associate Degree</option>
                  <option value="bachelor_degree">Bachelor's Degree</option>
                  <option value="master_degree">Master's Degree</option>
                  <option value="doctoral_degree">Doctoral Degree (PhD)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Status
                </label>
                <select
                  value={profileData.employment_status}
                  onChange={(e) => setProfileData({ ...profileData, employment_status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select employment status</option>
                  <option value="student">Student</option>
                  <option value="employed">Employed</option>
                  <option value="self_employed">Self-Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation/Field of Study
                </label>
                <input
                  type="text"
                  value={profileData.occupation}
                  onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Teacher, Engineer, Business Administration"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your job title if employed, or field of study if student
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Phone className="mr-2 text-emerald-700" size={24} />
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={profileData.emergency_contact_name}
                  onChange={(e) => setProfileData({ ...profileData, emergency_contact_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Full name of emergency contact"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={profileData.emergency_contact_phone}
                  onChange={(e) => setProfileData({ ...profileData, emergency_contact_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="+231-XXX-XXXX"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  value={profileData.emergency_contact_relationship}
                  onChange={(e) => setProfileData({ ...profileData, emergency_contact_relationship: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Spouse, Parent, Sibling, Friend"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:bg-gray-400 font-semibold"
            >
              <Save size={20} className="mr-2" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* Change Password Section */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Lock className="mr-2 text-emerald-700" size={24} />
            Change Password
          </h2>
          
          {/* Login Info Banner */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-blue-900">
                  Login Information
                </h3>
                <p className="text-sm text-blue-800 mt-1">
                  Your email address <strong className="font-bold">{profileData.email}</strong> is your login name. 
                  Use this email and your password to sign in to the system.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full flex items-center justify-center px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:bg-gray-400"
            >
              <Lock size={18} className="mr-2" />
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </main>

      {/* Change Email Modal */}
      {editingEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Change Email Address</h3>
            
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Changing your email will change your login name. 
                You will be logged out and need to login with your new email address.
              </p>
            </div>

            {/* Error Display */}
            {emailError && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {emailError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailError('')}
                    className="ml-auto flex-shrink-0 text-red-500 hover:text-red-700"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleEmailChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Email Address *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter new email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showEmailPassword ? 'text' : 'password'}
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showEmailPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your current password to confirm this change
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingEmail(false);
                    setNewEmail('');
                    setEmailPassword('');
                    setShowEmailPassword(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingEmail}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {changingEmail ? 'Changing...' : 'Change Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
