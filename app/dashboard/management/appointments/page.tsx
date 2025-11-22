'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Phone, Mail, User, Check, X, CheckCircle, XCircle } from 'lucide-react';

interface Appointment {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  reason: string | null;
  status: string;
  created_at: string;
}

export default function ManagementAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchAppointments(); // Refresh list
        setNotification({ type: 'success', message: `Appointment ${status} successfully!` });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setNotification({ type: 'error', message: 'Failed to update appointment' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredAppointments = filter === 'all' 
    ? appointments 
    : appointments.filter(apt => apt.status === filter);

  const stats = {
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/management')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Appointment Management</h1>
                <p className="text-sm text-gray-600">Review and manage patient appointments</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Confirmed</p>
            <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex space-x-2">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md capitalize transition-colors ${
                  filter === status
                    ? 'bg-emerald-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading appointments...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No {filter !== 'all' ? filter : ''} appointments</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <User className="text-emerald-700" size={20} />
                        <h3 className="text-lg font-semibold text-gray-900">{appointment.name}</h3>
                        <span className={`px-3 py-1 text-xs rounded-full border ${getStatusBadgeColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail size={16} className="mr-2 text-gray-400" />
                          {appointment.email}
                        </div>
                        {appointment.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone size={16} className="mr-2 text-gray-400" />
                            {appointment.phone}
                          </div>
                        )}
                        {appointment.preferred_date && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar size={16} className="mr-2 text-gray-400" />
                            {new Date(appointment.preferred_date).toLocaleDateString()}
                          </div>
                        )}
                        {appointment.preferred_time && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock size={16} className="mr-2 text-gray-400" />
                            {appointment.preferred_time}
                          </div>
                        )}
                      </div>

                      {appointment.reason && (
                        <div className="bg-gray-50 p-3 rounded-md mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                          <p className="text-sm text-gray-600">{appointment.reason}</p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Requested: {new Date(appointment.created_at).toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    {appointment.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          <Check size={16} />
                          <span>Confirm</span>
                        </button>
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                          className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          <X size={16} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                    {appointment.status === 'confirmed' && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ml-4"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div
              className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg border-l-4 ${
                notification.type === 'success'
                  ? 'bg-white border-green-500'
                  : 'bg-white border-red-500'
              }`}
              style={{
                minWidth: '320px',
                maxWidth: '500px',
                animation: 'slideIn 0.3s ease-out',
              }}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <XCircle className="text-red-600" size={20} />
                )}
              </div>
              <div className="flex-1">
                <h4
                  className={`font-semibold ${
                    notification.type === 'success' ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {notification.type === 'success' ? 'Success!' : 'Error'}
                </h4>
                <p
                  className={`text-sm ${
                    notification.type === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
