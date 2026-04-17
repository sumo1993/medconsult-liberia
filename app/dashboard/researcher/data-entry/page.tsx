'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList, Plus, Save, Trash2, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import GPSCapture from '@/components/GPSCapture';
import PhotoCapture from '@/components/PhotoCapture';

interface DataEntry {
  id: number;
  field_name: string;
  value: string;
}

export default function DataEntryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    project: '',
    entry_type: 'patient_data',
    location: '',
    date: new Date().toISOString().split('T')[0],
    gps_lat: null as number | null,
    gps_lng: null as number | null,
    gps_accuracy: null as number | null,
  });
  const [entries, setEntries] = useState<DataEntry[]>([
    { id: 1, field_name: '', value: '' },
  ]);
  const [photos, setPhotos] = useState<{ data: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const addEntry = () => {
    setEntries([...entries, { id: Date.now(), field_name: '', value: '' }]);
  };

  const removeEntry = (id: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: number, field: 'field_name' | 'value', value: string) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('auth-token');
      
      // Filter out empty entries
      const validEntries = entries.filter(e => e.field_name && e.value);
      
      if (validEntries.length === 0) {
        setNotification({
          type: 'error',
          message: 'Please add at least one data field with values.',
        });
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/researcher/data-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          entry_type: formData.entry_type,
          location: formData.location,
          entry_date: formData.date,
          data_fields: validEntries.map(e => ({ field_name: e.field_name, value: e.value })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Data entry saved successfully!',
        });
        
        // Reset entries
        setEntries([{ id: 1, field_name: '', value: '' }]);
        setFormData({
          project: '',
          entry_type: 'patient_data',
          location: '',
          date: new Date().toISOString().split('T')[0],
          gps_lat: null,
          gps_lng: null,
          gps_accuracy: null,
        });
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to save data. Please try again.',
        });
      }
    } catch (error) {
      console.error('Data entry error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to save data. Please try again.',
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const entryTypes = [
    { value: 'patient_data', label: 'Patient Data' },
    { value: 'survey_response', label: 'Survey Response' },
    { value: 'lab_result', label: 'Lab Result' },
    { value: 'environmental', label: 'Environmental Data' },
    { value: 'demographic', label: 'Demographic Data' },
    { value: 'custom', label: 'Custom Entry' },
  ];

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
                <h1 className="text-xl font-bold text-gray-900">Data Collection Entry</h1>
                <p className="text-sm text-gray-600">Enter field data and observations</p>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entry Type *</label>
                <select
                  value={formData.entry_type}
                  onChange={(e) => setFormData({ ...formData, entry_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {entryTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Community Health Center, Gbarnga"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* GPS Capture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline-block mr-1" size={16} />
                GPS Coordinates (Optional)
              </label>
              <GPSCapture
                onLocationCaptured={(lat, lng, accuracy) => {
                  setFormData(prev => ({
                    ...prev,
                    gps_lat: lat,
                    gps_lng: lng,
                    gps_accuracy: accuracy,
                  }));
                }}
                onAddressResolved={(locationName) => {
                  setFormData(prev => ({
                    ...prev,
                    location: locationName,
                  }));
                }}
              />
            </div>

            {/* Photo Capture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📷 Capture Photos (Optional)
              </label>
              <PhotoCapture
                onPhotosCaptured={setPhotos}
                maxPhotos={5}
              />
            </div>

            {/* Data Fields */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">Data Fields</label>
                <button
                  type="button"
                  onClick={addEntry}
                  className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm"
                >
                  <Plus size={16} /> Add Field
                </button>
              </div>
              
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <div key={entry.id} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={entry.field_name}
                        onChange={(e) => updateEntry(entry.id, 'field_name', e.target.value)}
                        placeholder="Field name (e.g., Age, Temperature, Symptoms)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={entry.value}
                        onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
                        placeholder="Value"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      disabled={entries.length === 1}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Templates */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Templates</p>
              <div className="flex flex-wrap gap-2">
                {['Malaria Survey', 'Patient Vitals', 'Water Quality', 'Vaccination Record'].map(template => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => {
                      // Pre-fill with template fields
                      if (template === 'Patient Vitals') {
                        setEntries([
                          { id: 1, field_name: 'Patient ID', value: '' },
                          { id: 2, field_name: 'Age', value: '' },
                          { id: 3, field_name: 'Gender', value: '' },
                          { id: 4, field_name: 'Temperature (°C)', value: '' },
                          { id: 5, field_name: 'Blood Pressure', value: '' },
                          { id: 6, field_name: 'Symptoms', value: '' },
                        ]);
                      } else if (template === 'Malaria Survey') {
                        setEntries([
                          { id: 1, field_name: 'Respondent ID', value: '' },
                          { id: 2, field_name: 'Household Size', value: '' },
                          { id: 3, field_name: 'Bed Nets Used', value: '' },
                          { id: 4, field_name: 'Malaria Cases (Last Month)', value: '' },
                          { id: 5, field_name: 'Treatment Sought', value: '' },
                        ]);
                      }
                    }}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm hover:border-emerald-500 hover:text-emerald-600"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Entry
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
