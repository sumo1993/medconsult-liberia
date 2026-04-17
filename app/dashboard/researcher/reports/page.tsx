'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileSpreadsheet, Download, Eye, Calendar, Filter, Search, FileText, BarChart2, BookOpen } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import PaginationControls from '@/components/PaginationControls';
import Toast from '@/components/Toast';

interface Report {
  id: number;
  title: string;
  description: string;
  project_name: string;
  report_type: string;
  created_at: string;
  file_size: string;
  status: 'published' | 'draft';
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/researcher/reports', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.project_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || report.report_type === typeFilter;
    return matchesSearch && matchesType;
  });
  const sortedReports = [...filteredReports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const totalPages = Math.max(1, Math.ceil(sortedReports.length / itemsPerPage));
  const paginatedReports = sortedReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [reports, searchQuery, typeFilter]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quarterly': return <BarChart2 className="text-blue-500" size={20} />;
      case 'annual': return <BookOpen className="text-purple-500" size={20} />;
      case 'detailed': return <FileText className="text-orange-500" size={20} />;
      default: return <FileSpreadsheet className="text-emerald-500" size={20} />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'quarterly': return 'bg-blue-100 text-blue-800';
      case 'annual': return 'bg-purple-100 text-purple-800';
      case 'detailed': return 'bg-orange-100 text-orange-800';
      case 'special': return 'bg-pink-100 text-pink-800';
      default: return 'bg-emerald-100 text-emerald-800';
    }
  };

  const handleDownload = (report: Report) => {
    // In production, this would download the actual file
    setToast({
      message: `Downloading: ${report.title}. This demo does not include a real file yet.`,
      type: 'info',
    });
  };

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
                <h1 className="text-xl font-bold text-gray-900">Research Reports</h1>
                <p className="text-sm text-gray-600">View and download research reports</p>
              </div>
            </div>
            <ProfileAvatar onClick={() => router.push('/dashboard/researcher/profile')} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 mb-6 text-white">
          <h3 className="font-semibold mb-1">📊 Research Reports Library</h3>
          <p className="text-sm text-emerald-100">
            Access reports generated from research projects and data submissions. Download reports to review findings, share with stakeholders, or use for analysis.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="summary">Summary</option>
            <option value="detailed">Detailed</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="special">Special</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Reports</p>
            <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Quarterly</p>
            <p className="text-2xl font-bold text-blue-600">
              {reports.filter(r => r.report_type === 'quarterly').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Annual</p>
            <p className="text-2xl font-bold text-purple-600">
              {reports.filter(r => r.report_type === 'annual').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold text-emerald-600">
              {reports.filter(r => {
                const date = new Date(r.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <FileSpreadsheet className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600 mb-4">
              {reports.length === 0 
                ? "Research reports will appear here once they are published."
                : "No reports match your search criteria."}
            </p>
            <p className="text-sm text-gray-500">
              Reports are generated from completed research projects and data submissions.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {getTypeIcon(report.report_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{report.title}</h3>
                    <p className="text-sm text-gray-500">{report.project_name}</p>
                  </div>
                </div>

                {report.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{report.description}</p>
                )}

                <div className="flex items-center justify-between text-sm mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(report.report_type)}`}>
                    {report.report_type}
                  </span>
                  <span className="text-gray-500">{report.file_size}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setSelectedReport(report)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleDownload(report)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && sortedReports.length > 0 && (
          <div className="mt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-emerald-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(selectedReport.report_type)}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedReport.title}</h3>
                      <p className="text-sm text-gray-500">{selectedReport.project_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                {selectedReport.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">{selectedReport.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-500">Report Type</p>
                    <p className="font-medium capitalize">{selectedReport.report_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">File Size</p>
                    <p className="font-medium">{selectedReport.file_size}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="font-medium">{new Date(selectedReport.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-medium capitalize text-green-600">Published</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleDownload(selectedReport);
                    setSelectedReport(null);
                  }}
                  className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
