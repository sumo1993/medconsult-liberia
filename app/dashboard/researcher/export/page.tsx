'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileSpreadsheet, FileText, CheckCircle, Loader2 } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import PaginationControls from '@/components/PaginationControls';
import Toast from '@/components/Toast';

export default function ExportPage() {
  const router = useRouter();
  const [exporting, setExporting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleExport = async (type: string, format: string) => {
    const key = `${type}-${format}`;
    setExporting(key);
    setSuccess(null);

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/researcher/export?type=${type}&format=${format}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setSuccess(key);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setSuccess(key);
      }
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: 'Failed to export data. Please try again.', type: 'error' });
    } finally {
      setExporting(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const exportOptions = [
    {
      type: 'submissions',
      title: 'Data Submissions',
      description: 'Export all your research data submissions including title, type, location, and status.',
      icon: FileSpreadsheet,
      color: 'bg-emerald-500',
    },
    {
      type: 'entries',
      title: 'Field Data Entries',
      description: 'Export all your field data collection entries with all data fields.',
      icon: FileText,
      color: 'bg-blue-500',
    },
  ];
  const totalPages = Math.max(1, Math.ceil(exportOptions.length / itemsPerPage));
  const paginatedExportOptions = exportOptions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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
                <h1 className="text-xl font-bold text-gray-900">Export Data</h1>
                <p className="text-sm text-gray-600">Download your research data</p>
              </div>
            </div>
            <ProfileAvatar onClick={() => router.push('/dashboard/researcher/profile')} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 mb-6 text-white">
          <h3 className="font-semibold mb-1">📥 Export Your Research Data</h3>
          <p className="text-sm text-emerald-100">
            Download your data in CSV or JSON format for external analysis, backup, or reporting.
          </p>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          {paginatedExportOptions.map((option) => (
            <div key={option.type} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center`}>
                  <option.icon className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{option.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleExport(option.type, 'csv')}
                  disabled={!!exporting}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {exporting === `${option.type}-csv` ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Exporting...
                    </>
                  ) : success === `${option.type}-csv` ? (
                    <>
                      <CheckCircle size={18} />
                      Downloaded!
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Export as CSV
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleExport(option.type, 'json')}
                  disabled={!!exporting}
                  className="flex-1 px-4 py-3 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {exporting === `${option.type}-json` ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Exporting...
                    </>
                  ) : success === `${option.type}-json` ? (
                    <>
                      <CheckCircle size={18} />
                      Downloaded!
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Export as JSON
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        {exportOptions.length > 0 && (
          <div className="mt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Export Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>CSV format</strong> is best for Excel/Google Sheets</li>
            <li>• <strong>JSON format</strong> is best for data analysis tools</li>
            <li>• Exports include all your data from day one</li>
            <li>• Large exports may take a few seconds to process</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
