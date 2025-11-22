'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, User, Mail, Phone, Linkedin, Facebook, Eye, EyeOff, Upload, Image as ImageIcon } from 'lucide-react';

export default function AdminTeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    specialization: '',
    bio: '',
    photo: '',
    email: '',
    phone: '',
    linkedin: '',
    facebook: '',
    display_order: 0,
    status: 'active'
  });
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/team-members', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const uploadFormData = new FormData();
      uploadFormData.append('photo', file);

      const response = await fetch('/api/team-members/upload-photo', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.photoUrl;
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload photo');
        return null;
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare the data to submit
    let dataToSubmit = { ...formData };
    
    // Upload photo if a new file was selected
    if (photoFile) {
      const photoUrl = await handlePhotoUpload(photoFile);
      if (photoUrl) {
        dataToSubmit.photo = photoUrl;
      }
    }
    
    try {
      const token = localStorage.getItem('auth-token');
      const url = editingId ? `/api/team-members/${editingId}` : '/api/team-members';
      const method = editingId ? 'PUT' : 'POST';

      console.log('Submitting team member with data:', dataToSubmit);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', role: '', specialization: '', bio: '', photo: '', email: '', phone: '', linkedin: '', facebook: '', display_order: 0, status: 'active' });
        setPhotoFile(null);
        fetchMembers();
        setSuccessMessage(editingId ? 'Team member updated successfully!' : 'Team member added successfully!');
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        alert(`Failed to save: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving team member:', error);
      alert('An error occurred while saving');
    }
  };

  const handleEdit = (member: any) => {
    // Convert twitter to facebook if it exists (for backwards compatibility)
    const editData = { ...member };
    if (editData.twitter && !editData.facebook) {
      editData.facebook = editData.twitter;
    }
    delete editData.twitter;
    
    setFormData(editData);
    setEditingId(member.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/team-members/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        fetchMembers();
        setSuccessMessage('Team member deleted successfully!');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
    }
  };

  return (
    <>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <User className="text-emerald-600" size={32} />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Success!
              </h3>
              
              <p className="text-gray-600 mb-6">
                {successMessage}
              </p>
              
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Manage Team Members</h1>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setFormData({ name: '', role: '', specialization: '', bio: '', photo: '', email: '', phone: '', linkedin: '', facebook: '', display_order: 0, status: 'active' });
              }}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
            >
              {showForm ? <X size={20} /> : <Plus size={20} />}
              {showForm ? 'Cancel' : 'Add Team Member'}
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? 'Edit Team Member' : 'Add New Team Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Dr. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role/Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Medical Consultant"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Cardiology, Pediatrics, etc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo
                  </label>
                  <div className="space-y-3">
                    {/* File Upload */}
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 cursor-pointer transition-colors">
                        <Upload size={20} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {photoFile ? photoFile.name : 'Click to upload photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setPhotoFile(file);
                          }}
                          className="hidden"
                        />
                      </label>
                      {photoFile && (
                        <button
                          type="button"
                          onClick={() => setPhotoFile(null)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                    
                    {/* Or URL Input */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or enter URL</span>
                      </div>
                    </div>
                    
                    <input
                      type="url"
                      value={formData.photo}
                      onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="https://example.com/photo.jpg"
                    />
                    
                    {/* Preview */}
                    {formData.photo && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img 
                          src={formData.photo} 
                          alt="Preview" 
                          className="w-16 h-16 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span className="text-sm text-gray-600">Photo preview</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="+231 XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="https://facebook.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Brief bio about the team member..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: '', role: '', specialization: '', bio: '', photo: '', email: '', phone: '', linkedin: '', facebook: '', display_order: 0, status: 'active' });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {editingId ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Team Members List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Team Members</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            </div>
          ) : members.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {member.photo && (
                    <img 
                      src={member.photo} 
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                  )}
                  {!member.photo && (
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-emerald-100 flex items-center justify-center">
                      <User size={40} className="text-emerald-600" />
                    </div>
                  )}
                  
                  <h3 className="font-bold text-lg text-gray-900 text-center">{member.name}</h3>
                  <p className="text-emerald-600 font-semibold text-center mb-2">{member.role}</p>
                  
                  {member.specialization && (
                    <p className="text-sm text-gray-600 text-center mb-3">{member.specialization}</p>
                  )}

                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status === 'active' ? <Eye size={12} className="inline mr-1" /> : <EyeOff size={12} className="inline mr-1" />}
                      {member.status}
                    </span>
                  </div>

                  {member.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{member.bio}</p>
                  )}

                  <div className="flex gap-2 text-gray-600 justify-center mb-4">
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="hover:text-emerald-600">
                        <Mail size={18} />
                      </a>
                    )}
                    {member.phone && (
                      <a href={`tel:${member.phone}`} className="hover:text-emerald-600">
                        <Phone size={18} />
                      </a>
                    )}
                    {member.linkedin && (
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">
                        <Linkedin size={18} />
                      </a>
                    )}
                    {member.facebook && (
                      <a href={member.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">
                        <Facebook size={18} />
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(member)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <User size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No team members added yet. Click "Add Team Member" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
