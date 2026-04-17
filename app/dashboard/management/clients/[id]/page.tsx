'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, FileText, Mail, UserCheck } from 'lucide-react';

interface Client {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  assignments_count: number;
  completed_count: number;
  last_contact: string;
}

export default function ManagementClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = Number(params?.id);

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const response = await fetch('/api/management/clients', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) return;
        const data: Client[] = await response.json();
        const match = data.find((item) => item.id === clientId) || null;
        setClient(match);
      } catch (error) {
        console.error('Error fetching client detail:', error);
      } finally {
        setLoading(false);
      }
    };

    if (Number.isFinite(clientId) && clientId > 0) {
      fetchClient();
    } else {
      setLoading(false);
    }
  }, [clientId]);

  const inProgress = useMemo(() => {
    if (!client) return 0;
    return Math.max(0, client.assignments_count - client.completed_count);
  }, [client]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.push('/dashboard/management/clients')}
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={18} />
            Back to Clients
          </button>
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Client not found</h1>
            <p className="text-gray-600">This client may not be assigned to your account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/dashboard/management/clients')}
          className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={18} />
          Back to Clients
        </button>

        <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
              {client.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.full_name}</h1>
              <p className="text-gray-600">{client.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{client.assignments_count}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-emerald-700">{client.completed_count}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-blue-700">{inProgress}</p>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={16} />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar size={16} />
              <span>Last contact: {formatDate(client.last_contact)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push(`/dashboard/management/assignment-requests?client=${client.id}`)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <FileText size={16} />
              View Assignment Requests
            </button>
            <button
              onClick={() => {
                window.location.href = `mailto:${client.email}`;
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <UserCheck size={16} />
              Contact Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
