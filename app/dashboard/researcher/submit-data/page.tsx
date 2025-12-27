'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface Project {
  id: number;
  title: string;
  location: string;
}

export default function SubmitDataPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    project_id: '',
    data_type: 'survey',
    title: '',
    description: '',
    location: '',
    date_collected: new Date().toISOString().split('T')[0],
    sample_count: '',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/researcher/projects', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('auth-token');
      
      // Convert file to base64 if present
      let fileData = null;
      let fileName = null;
      let fileType = null;
      
      if (file) {
        const reader = new FileReader();
        const filePromise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        fileData = await filePromise;
        fileName = file.name;
        fileType = file.type;
      }

      const response = await fetch('/api/researcher/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...formData,
          file_data: fileData,
          file_name: fileName,
          file_type: fileType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Data submitted successfully! It will be reviewed by the research team.',
        });
        
        // Reset form
        setFormData({
          project_id: '',
          data_type: 'survey',
          title: '',
          description: '',
          location: '',
          date_collected: new Date().toISOString().split('T')[0],
          sample_count: '',
          notes: '',
        });
        setFile(null);
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to submit data. Please try again.',
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to submit data. Please try again.',
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/researcher')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Submit Research Data</h1>
                <p className="text-sm text-gray-600">Upload field data and observations</p>
              </div>
            </div>
            <ProfileAvatar onClick={() => router.push('/dashboard/researcher/profile')} />
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

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selection */}
            {projects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Related Project (Optional)</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => {
                    const selectedProject = projects.find(p => p.id.toString() === e.target.value);
                    setFormData({ 
                      ...formData, 
                      project_id: e.target.value,
                      location: selectedProject?.location || formData.location 
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select a project --</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Data Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Type *</label>
              <select
                value={formData.data_type}
                onChange={(e) => setFormData({ ...formData, data_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="survey">Survey Data</option>
                <option value="observation">Field Observation</option>
                <option value="sample">Sample Collection</option>
                <option value="interview">Interview Data</option>
                <option value="measurement">Measurements</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Malaria Survey - Gbarnga Region Week 3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the data collected, methodology used, and any important observations..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Location and Date */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Gbarnga, Bong County"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Collected *</label>
                <input
                  type="date"
                  value={formData.date_collected}
                  onChange={(e) => setFormData({ ...formData, date_collected: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Sample Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Samples/Respondents</label>
              <input
                type="number"
                value={formData.sample_count}
                onChange={(e) => setFormData({ ...formData, sample_count: e.target.value })}
                placeholder="e.g., 50"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attach Files (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                  accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto mb-2 text-gray-400" size={40} />
                  <p className="text-gray-600">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    CSV, Excel, PDF, Word, or Images (max 10MB)
                  </p>
                </label>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any challenges faced, recommendations, or additional context..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Submit Data
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

