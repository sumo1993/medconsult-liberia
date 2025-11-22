'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Download, Search, Filter, Calendar, User } from 'lucide-react';

interface Material {
  id: number;
  title: string;
  description: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  uploaded_by: number;
  upload_date: string;
  downloads: number;
  uploader_name: string;
  uploader_email: string;
}

export default function ClientMaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [searchTerm, selectedCategory, materials]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/materials');
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials);
        setFilteredMaterials(data.materials);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = materials;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (material) =>
          material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((material) => material.category === selectedCategory);
    }

    setFilteredMaterials(filtered);
  };

  const handleDownload = async (material: Material) => {
    try {
      // Increment download count
      await fetch(`/api/materials/${material.id}`, {
        method: 'PUT',
      });

      // Trigger download
      const link = document.createElement('a');
      link.href = material.file_path;
      link.download = material.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Refresh materials to update download count
      fetchMaterials();
    } catch (error) {
      console.error('Error downloading material:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'General': 'bg-gray-100 text-gray-800',
      'Medicine': 'bg-blue-100 text-blue-800',
      'Surgery': 'bg-red-100 text-red-800',
      'Pediatrics': 'bg-green-100 text-green-800',
      'Research': 'bg-purple-100 text-purple-800',
      'Cardiology': 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const categories = ['all', ...Array.from(new Set(materials.map((m) => m.category)))];

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
              <h1 className="text-2xl font-bold text-gray-900">Study Materials</h1>
              <p className="text-sm text-gray-600">Download educational resources and materials</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading materials...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">No materials found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Check back later for new materials'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                {/* Icon and Category */}
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-emerald-100 p-3 rounded-lg">
                    <FileText className="text-emerald-700" size={24} />
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${getCategoryColor(material.category)}`}>
                    {material.category}
                  </span>
                </div>

                {/* Title and Description */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{material.title}</h3>
                {material.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{material.description}</p>
                )}

                {/* File Info */}
                <div className="space-y-2 mb-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <FileText size={14} className="mr-2" />
                    <span className="truncate">{material.file_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{formatFileSize(material.file_size)}</span>
                    <span>{material.downloads} downloads</span>
                  </div>
                </div>

                {/* Uploader and Date */}
                <div className="border-t pt-4 mb-4 text-xs text-gray-500">
                  <div className="flex items-center mb-1">
                    <User size={12} className="mr-1" />
                    <span>{material.uploader_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={12} className="mr-1" />
                    <span>{new Date(material.upload_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={() => handleDownload(material)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
                >
                  <Download size={18} />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
