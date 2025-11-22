'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Save, User, GraduationCap, Briefcase, Lock, Eye, EyeOff } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

export default function ManagementProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Password reset state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    title: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    gender: '',
    country: '',
    city: '',
    county: '',
    educational_level: '',
    specialization: '',
    years_of_experience: '',
    license_number: '',
    research_interests: '',
    current_projects: '',
    bio: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/profile', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData({
          full_name: data.full_name || '',
          title: data.title || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
          gender: data.gender || '',
          country: data.country || '',
          city: data.city || '',
          county: data.county || '',
          educational_level: data.educational_level || '',
          specialization: data.specialization || '',
          years_of_experience: data.years_of_experience || '',
          license_number: data.license_number || '',
          research_interests: data.research_interests || '',
          current_projects: data.current_projects || '',
          bio: data.bio || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
          showNotification('success', 'Profile photo updated!');
          window.location.reload();
        } else {
          showNotification('error', 'Failed to upload photo');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showNotification('error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showNotification('error', 'Password must be at least 8 characters long');
      return;
    }

    setSaving(true);
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
          newPassword: passwordData.newPassword
        }),
      });

      if (response.ok) {
        showNotification('success', 'Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordSection(false);
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to change password');
      }
    } catch (error) {
      showNotification('error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('auth-token');
      console.log('Submitting profile data:', profileData);
      
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok) {
        showNotification('success', 'Profile updated successfully!');
      } else {
        console.error('Update failed:', data);
        showNotification('error', data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/management')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-600">Manage your professional profile</p>
            </div>
          </div>
        </div>
      </header>

      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Camera className="mr-2 text-emerald-600" />
            Profile Photo
          </h2>
          <div className="flex items-center space-x-6">
            <ProfileAvatar size="lg" />
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-4">
                Upload a professional photo.
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
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <User className="mr-2 text-emerald-600" />
            Professional Information
          </h2>

          <div className="space-y-6">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Title
                </label>
                <select
                  value={profileData.title}
                  onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select title...</option>
                  <optgroup label="Medical Doctors">
                    <option value="Dr.">Dr. (Doctor)</option>
                    <option value="MD">MD (Medical Doctor)</option>
                    <option value="DO">DO (Doctor of Osteopathic Medicine)</option>
                    <option value="MBBS">MBBS (Bachelor of Medicine, Bachelor of Surgery)</option>
                    <option value="MBChB">MBChB (Bachelor of Medicine and Surgery)</option>
                  </optgroup>
                  <optgroup label="Specialists">
                    <option value="Dr. (Specialist)">Dr. (Specialist)</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Surgeon">Surgeon</option>
                    <option value="Physician">Physician</option>
                  </optgroup>
                  <optgroup label="Academic Titles">
                    <option value="Prof.">Prof. (Professor)</option>
                    <option value="Prof. Dr.">Prof. Dr.</option>
                    <option value="Assoc. Prof.">Assoc. Prof. (Associate Professor)</option>
                    <option value="Asst. Prof.">Asst. Prof. (Assistant Professor)</option>
                  </optgroup>
                  <optgroup label="Advanced Degrees">
                    <option value="PhD">PhD (Doctor of Philosophy)</option>
                    <option value="DrPH">DrPH (Doctor of Public Health)</option>
                    <option value="ScD">ScD (Doctor of Science)</option>
                    <option value="MPH">MPH (Master of Public Health)</option>
                    <option value="MSc">MSc (Master of Science)</option>
                  </optgroup>
                  <optgroup label="Nursing">
                    <option value="RN">RN (Registered Nurse)</option>
                    <option value="NP">NP (Nurse Practitioner)</option>
                    <option value="CNS">CNS (Clinical Nurse Specialist)</option>
                    <option value="DNP">DNP (Doctor of Nursing Practice)</option>
                  </optgroup>
                  <optgroup label="Other Healthcare">
                    <option value="PA">PA (Physician Assistant)</option>
                    <option value="PharmD">PharmD (Doctor of Pharmacy)</option>
                    <option value="DDS">DDS (Doctor of Dental Surgery)</option>
                    <option value="DMD">DMD (Doctor of Dental Medicine)</option>
                  </optgroup>
                  <optgroup label="General">
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Mx.">Mx.</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={profileData.phone_number}
                  onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={profileData.date_of_birth || ''}
                  onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
                {profileData.date_of_birth && (
                  <p className="text-sm text-gray-600 mt-2">
                    Age: {(() => {
                      const today = new Date();
                      const birthDate = new Date(profileData.date_of_birth);
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      return age;
                    })()} years old
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  value={profileData.country}
                  onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select country...</option>
                  <optgroup label="West Africa">
                    <option value="Liberia">Liberia</option>
                    <option value="Sierra Leone">Sierra Leone</option>
                    <option value="Guinea">Guinea</option>
                    <option value="Guinea-Bissau">Guinea-Bissau</option>
                    <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Benin">Benin</option>
                    <option value="Togo">Togo</option>
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="Mali">Mali</option>
                    <option value="Senegal">Senegal</option>
                    <option value="Gambia">Gambia</option>
                    <option value="Mauritania">Mauritania</option>
                    <option value="Niger">Niger</option>
                    <option value="Cape Verde">Cape Verde</option>
                  </optgroup>
                  <optgroup label="East Africa">
                    <option value="Kenya">Kenya</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="Burundi">Burundi</option>
                    <option value="Ethiopia">Ethiopia</option>
                    <option value="Somalia">Somalia</option>
                    <option value="Djibouti">Djibouti</option>
                    <option value="Eritrea">Eritrea</option>
                    <option value="South Sudan">South Sudan</option>
                  </optgroup>
                  <optgroup label="Southern Africa">
                    <option value="South Africa">South Africa</option>
                    <option value="Botswana">Botswana</option>
                    <option value="Namibia">Namibia</option>
                    <option value="Zimbabwe">Zimbabwe</option>
                    <option value="Zambia">Zambia</option>
                    <option value="Mozambique">Mozambique</option>
                    <option value="Malawi">Malawi</option>
                    <option value="Lesotho">Lesotho</option>
                    <option value="Eswatini">Eswatini</option>
                    <option value="Angola">Angola</option>
                  </optgroup>
                  <optgroup label="Central Africa">
                    <option value="Cameroon">Cameroon</option>
                    <option value="Chad">Chad</option>
                    <option value="Central African Republic">Central African Republic</option>
                    <option value="Congo">Congo</option>
                    <option value="Democratic Republic of Congo">Democratic Republic of Congo</option>
                    <option value="Gabon">Gabon</option>
                    <option value="Equatorial Guinea">Equatorial Guinea</option>
                    <option value="São Tomé and Príncipe">São Tomé and Príncipe</option>
                  </optgroup>
                  <optgroup label="North Africa">
                    <option value="Egypt">Egypt</option>
                    <option value="Libya">Libya</option>
                    <option value="Tunisia">Tunisia</option>
                    <option value="Algeria">Algeria</option>
                    <option value="Morocco">Morocco</option>
                    <option value="Sudan">Sudan</option>
                  </optgroup>
                  <optgroup label="Americas">
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Mexico">Mexico</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Peru">Peru</option>
                    <option value="Venezuela">Venezuela</option>
                    <option value="Jamaica">Jamaica</option>
                    <option value="Haiti">Haiti</option>
                    <option value="Dominican Republic">Dominican Republic</option>
                  </optgroup>
                  <optgroup label="Europe">
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="France">France</option>
                    <option value="Germany">Germany</option>
                    <option value="Italy">Italy</option>
                    <option value="Spain">Spain</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Belgium">Belgium</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Sweden">Sweden</option>
                    <option value="Norway">Norway</option>
                    <option value="Denmark">Denmark</option>
                    <option value="Poland">Poland</option>
                    <option value="Russia">Russia</option>
                  </optgroup>
                  <optgroup label="Asia">
                    <option value="China">China</option>
                    <option value="India">India</option>
                    <option value="Japan">Japan</option>
                    <option value="South Korea">South Korea</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Philippines">Philippines</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                  </optgroup>
                  <optgroup label="Oceania">
                    <option value="Australia">Australia</option>
                    <option value="New Zealand">New Zealand</option>
                    <option value="Papua New Guinea">Papua New Guinea</option>
                    <option value="Fiji">Fiji</option>
                  </optgroup>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {profileData.country === 'Liberia' ? 'County' : 'State/Region'}
                </label>
                {profileData.country === 'Liberia' ? (
                  <select
                    value={profileData.county}
                    onChange={(e) => setProfileData({ ...profileData, county: e.target.value, city: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select county...</option>
                    <option value="Bomi">Bomi</option>
                    <option value="Bong">Bong</option>
                    <option value="Gbarpolu">Gbarpolu</option>
                    <option value="Grand Bassa">Grand Bassa</option>
                    <option value="Grand Cape Mount">Grand Cape Mount</option>
                    <option value="Grand Gedeh">Grand Gedeh</option>
                    <option value="Grand Kru">Grand Kru</option>
                    <option value="Lofa">Lofa</option>
                    <option value="Margibi">Margibi</option>
                    <option value="Maryland">Maryland</option>
                    <option value="Montserrado">Montserrado</option>
                    <option value="Nimba">Nimba</option>
                    <option value="River Cess">River Cess</option>
                    <option value="River Gee">River Gee</option>
                    <option value="Sinoe">Sinoe</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={profileData.county}
                    onChange={(e) => setProfileData({ ...profileData, county: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter state/region..."
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City/Town
                </label>
                {profileData.country === 'Liberia' ? (
                  <select
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={!profileData.county}
                  >
                    <option value="">Select city...</option>
                    {profileData.county === 'Montserrado' && (
                      <>
                        <option value="Monrovia">Monrovia</option>
                        <option value="Paynesville">Paynesville</option>
                        <option value="Congo Town">Congo Town</option>
                        <option value="New Kru Town">New Kru Town</option>
                        <option value="Sinkor">Sinkor</option>
                      </>
                    )}
                    {profileData.county === 'Bong' && (
                      <>
                        <option value="Gbarnga">Gbarnga</option>
                        <option value="Totota">Totota</option>
                        <option value="Salala">Salala</option>
                      </>
                    )}
                    {profileData.county === 'Nimba' && (
                      <>
                        <option value="Sanniquellie">Sanniquellie</option>
                        <option value="Ganta">Ganta</option>
                        <option value="Tappita">Tappita</option>
                      </>
                    )}
                    {profileData.county === 'Grand Bassa' && (
                      <>
                        <option value="Buchanan">Buchanan</option>
                        <option value="Compound #3">Compound #3</option>
                      </>
                    )}
                    {profileData.county === 'Margibi' && (
                      <>
                        <option value="Kakata">Kakata</option>
                        <option value="Harbel">Harbel</option>
                      </>
                    )}
                    {profileData.county === 'Lofa' && (
                      <>
                        <option value="Voinjama">Voinjama</option>
                        <option value="Foya">Foya</option>
                      </>
                    )}
                    {profileData.county === 'Grand Cape Mount' && (
                      <option value="Robertsport">Robertsport</option>
                    )}
                    {profileData.county === 'Maryland' && (
                      <>
                        <option value="Harper">Harper</option>
                        <option value="Pleebo">Pleebo</option>
                      </>
                    )}
                    {profileData.county === 'Bomi' && (
                      <option value="Tubmanburg">Tubmanburg</option>
                    )}
                    {profileData.county === 'Grand Gedeh' && (
                      <option value="Zwedru">Zwedru</option>
                    )}
                    {profileData.county === 'Sinoe' && (
                      <option value="Greenville">Greenville</option>
                    )}
                    {profileData.county === 'River Cess' && (
                      <option value="Cestos City">Cestos City</option>
                    )}
                    {profileData.county === 'Grand Kru' && (
                      <option value="Barclayville">Barclayville</option>
                    )}
                    {profileData.county === 'River Gee' && (
                      <option value="Fish Town">Fish Town</option>
                    )}
                    {profileData.county === 'Gbarpolu' && (
                      <option value="Bopolu">Bopolu</option>
                    )}
                    {profileData.county && <option value="Other">Other</option>}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter city/town..."
                  />
                )}
                {profileData.country === 'Liberia' && !profileData.county && (
                  <p className="text-xs text-gray-500 mt-1">Select a county first</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <GraduationCap className="mr-2 text-emerald-600" />
              Qualifications
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education Level
                  </label>
                  <select
                    value={profileData.educational_level}
                    onChange={(e) => setProfileData({ ...profileData, educational_level: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select education level...</option>
                    <optgroup label="Basic Education">
                      <option value="no_formal_education">No Formal Education</option>
                      <option value="primary">Primary School</option>
                      <option value="junior_high">Junior High School</option>
                      <option value="senior_high">Senior High School</option>
                      <option value="high_school_diploma">High School Diploma/GED</option>
                    </optgroup>
                    <optgroup label="Vocational & Technical">
                      <option value="vocational">Vocational Training</option>
                      <option value="technical_certificate">Technical Certificate</option>
                      <option value="trade_school">Trade School</option>
                    </optgroup>
                    <optgroup label="Undergraduate">
                      <option value="some_college">Some College (No Degree)</option>
                      <option value="associate_degree">Associate Degree (AA/AS)</option>
                      <option value="bachelor_degree">Bachelor's Degree (BA/BS/BSc)</option>
                    </optgroup>
                    <optgroup label="Graduate">
                      <option value="master_degree">Master's Degree (MA/MS/MSc/MBA)</option>
                      <option value="professional_degree">Professional Degree (JD/MD/DDS)</option>
                      <option value="doctoral_degree">Doctoral Degree (PhD/EdD/DBA)</option>
                    </optgroup>
                    <optgroup label="Medical Education">
                      <option value="mbbs">MBBS (Bachelor of Medicine, Bachelor of Surgery)</option>
                      <option value="md">MD (Doctor of Medicine)</option>
                      <option value="do">DO (Doctor of Osteopathic Medicine)</option>
                      <option value="medical_residency">Medical Residency</option>
                      <option value="medical_fellowship">Medical Fellowship</option>
                      <option value="board_certified">Board Certified Specialist</option>
                    </optgroup>
                    <optgroup label="Nursing Education">
                      <option value="lpn">LPN (Licensed Practical Nurse)</option>
                      <option value="rn_diploma">RN Diploma</option>
                      <option value="adn">ADN (Associate Degree in Nursing)</option>
                      <option value="bsn">BSN (Bachelor of Science in Nursing)</option>
                      <option value="msn">MSN (Master of Science in Nursing)</option>
                      <option value="dnp">DNP (Doctor of Nursing Practice)</option>
                      <option value="phd_nursing">PhD in Nursing</option>
                    </optgroup>
                    <optgroup label="Public Health">
                      <option value="mph">MPH (Master of Public Health)</option>
                      <option value="drph">DrPH (Doctor of Public Health)</option>
                      <option value="msph">MSPH (Master of Science in Public Health)</option>
                    </optgroup>
                    <optgroup label="Other Healthcare">
                      <option value="pharmd">PharmD (Doctor of Pharmacy)</option>
                      <option value="dds">DDS (Doctor of Dental Surgery)</option>
                      <option value="dmd">DMD (Doctor of Dental Medicine)</option>
                      <option value="dpt">DPT (Doctor of Physical Therapy)</option>
                      <option value="pa">PA (Physician Assistant)</option>
                    </optgroup>
                    <optgroup label="Postdoctoral">
                      <option value="postdoctoral">Postdoctoral Research</option>
                      <option value="postdoctoral_fellowship">Postdoctoral Fellowship</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={profileData.specialization}
                    onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years Experience
                  </label>
                  <input
                    type="number"
                    value={profileData.years_of_experience}
                    onChange={(e) => setProfileData({ ...profileData, years_of_experience: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={profileData.license_number}
                    onChange={(e) => setProfileData({ ...profileData, license_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Briefcase className="mr-2 text-emerald-600" />
              Research & Projects
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Research Interests
                </label>
                <textarea
                  value={profileData.research_interests}
                  onChange={(e) => setProfileData({ ...profileData, research_interests: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Projects
                </label>
                <textarea
                  value={profileData.current_projects}
                  onChange={(e) => setProfileData({ ...profileData, current_projects: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/management')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-3 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:bg-gray-400"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* Password Reset Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="text-emerald-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
            </div>
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              {showPasswordSection ? 'Hide' : 'Show'}
            </button>
          </div>

          {showPasswordSection && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-6 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:bg-gray-400"
                >
                  <Lock size={18} className="mr-2" />
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
