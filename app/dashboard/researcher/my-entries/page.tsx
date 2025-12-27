'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList, Search, Calendar, MapPin, Plus, Eye, Trash2 } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface DataEntry {
  id: number;
  entry_type: string;
  location: string;
  entry_date: string;
  data_fields: { field_name: string; value: string }[];
  status: string;
  created_at: string;
}

export default function MyEntriesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<DataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<DataEntry | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/researcher/data-entries', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        // Parse JSON data_fields if it's a string
        const parsedData = data.map((entry: any) => ({
          ...entry,
          data_fields: typeof entry.data_fields === 'string' 
            ? JSON.parse(entry.data_fields) 
            : entry.data_fields || []
        }));
        setEntries(parsedData);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.entry_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const entryTypeLabels: { [key: string]: string } = {
    patient_data: 'Patient Data',
    survey_response: 'Survey Response',
    lab_result: 'Lab Result',
    environmental: 'Environmental Data',
    demographic: 'Demographic Data',
    custom: 'Custom Entry',
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
                <h1 className="text-xl font-bold text-gray-900">My Data Entries</h1>
                <p className="text-sm text-gray-600">View all your field data entries</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard/researcher/data-entry')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <Plus size={18} />
                New Entry
              </button>
              <ProfileAvatar onClick={() => router.push('/dashboard/researcher/profile')} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by location or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Entries</p>
            <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Patient Data</p>
            <p className="text-2xl font-bold text-blue-600">
              {entries.filter(e => e.entry_type === 'patient_data').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Survey Responses</p>
            <p className="text-2xl font-bold text-purple-600">
              {entries.filter(e => e.entry_type === 'survey_response').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">This Week</p>
            <p className="text-2xl font-bold text-emerald-600">
              {entries.filter(e => {
                const date = new Date(e.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date >= weekAgo;
              }).length}
            </p>
          </div>
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <ClipboardList className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Entries Yet</h3>
            <p className="text-gray-600 mb-4">
              {entries.length === 0 
                ? "You haven't entered any field data yet."
                : "No entries match your search criteria."}
            </p>
            <button
              onClick={() => router.push('/dashboard/researcher/data-entry')}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Create Your First Entry
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {entryTypeLabels[entry.entry_type] || entry.entry_type}
                  </span>
                  <button
                    onClick={() => setSelectedEntry(entry)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                  >
                    <Eye size={18} />
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} />
                    <span>{entry.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} />
                    <span>{new Date(entry.entry_date || entry.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">
                    {entry.data_fields?.length || 0} data fields
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {entry.data_fields?.slice(0, 3).map((field, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {field.field_name}
                      </span>
                    ))}
                    {entry.data_fields?.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        +{entry.data_fields.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-emerald-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Entry Details</h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Entry Type</p>
                    <p className="font-medium">{entryTypeLabels[selectedEntry.entry_type] || selectedEntry.entry_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{selectedEntry.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{new Date(selectedEntry.entry_date || selectedEntry.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{new Date(selectedEntry.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Data Fields</h4>
                <div className="space-y-3">
                  {selectedEntry.data_fields?.map((field, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">{field.field_name}</span>
                      <span className="text-gray-900">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

