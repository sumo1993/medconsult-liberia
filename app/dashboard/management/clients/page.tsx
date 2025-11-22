'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Mail, Phone, Calendar, FileText, MessageSquare, Search, Filter } from 'lucide-react';

interface Client {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  assignments_count: number;
  completed_count: number;
  last_contact: string;
  total_spent?: number;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/management/clients', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedClients = [...filteredClients].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.full_name.localeCompare(b.full_name);
      case 'assignments':
        return b.assignments_count - a.assignments_count;
      case 'recent':
      default:
        return new Date(b.last_contact).getTime() - new Date(a.last_contact).getTime();
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
              <p className="text-sm text-gray-600">View and manage your clients</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-emerald-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{clients.length}</div>
            <div className="text-sm text-gray-600">Total Clients</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {clients.reduce((sum, c) => sum + c.assignments_count, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Assignments</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="text-purple-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {clients.reduce((sum, c) => sum + c.completed_count, 0)}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search clients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="recent">Recent Activity</option>
                <option value="name">Name (A-Z)</option>
                <option value="assignments">Most Assignments</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clients List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading clients...</p>
          </div>
        ) : sortedClients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Users className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'Clients will appear here once they submit assignments'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 cursor-pointer border border-gray-200 hover:border-emerald-500"
                onClick={() => router.push(`/dashboard/management/clients/${client.id}`)}
              >
                {/* Client Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {client.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate">{client.full_name}</h3>
                    <p className="text-sm text-gray-600 truncate">{client.email}</p>
                  </div>
                </div>

                {/* Client Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Assignments:</span>
                    <span className="font-semibold text-gray-900">{client.assignments_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-semibold text-green-600">{client.completed_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">In Progress:</span>
                    <span className="font-semibold text-blue-600">
                      {client.assignments_count - client.completed_count}
                    </span>
                  </div>
                </div>

                {/* Last Contact */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>Last contact: {formatDate(client.last_contact)}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `mailto:${client.email}`;
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                  >
                    <Mail size={16} />
                    Email
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/management/assignment-requests?client=${client.id}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <FileText size={16} />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
