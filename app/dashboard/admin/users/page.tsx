'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Trash2, X, CheckCircle, XCircle, Lock, Unlock, KeyRound } from 'lucide-react';
import PaginationControls from '@/components/PaginationControls';
import ProfileAvatar from '@/components/ProfileAvatar';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  status: string;
  created_at: string;
  password_change_locked?: number | boolean;
  password_changed_at?: string | null;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    userId: number;
    currentStatus: string;
    action: string;
  } | null>(null);
  const [passwordLockDialog, setPasswordLockDialog] = useState<{
    show: boolean;
    userId: number;
    userName: string;
    currentlyLocked: boolean;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    show: boolean;
    userId: number;
    userName: string;
  } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'client',
    phone: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const sortedUsers = [...users].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / itemsPerPage));
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      console.log('[Users Page] Token exists:', !!token);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('[Users Page] Fetching users...');
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
        headers,
      });
      
      console.log('[Users Page] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Users Page] Users fetched:', data.users.length);
        setUsers(data.users);
        setCurrentPage(1);
      } else {
        const rawText = await response.text();
        let errorData: any = { error: response.statusText || 'Unknown error' };
        if (rawText) {
          try {
            errorData = JSON.parse(rawText);
          } catch {
            errorData = { error: rawText };
          }
        }
        console.error('[Users Page] Failed to fetch users:', {
          status: response.status,
          error: errorData
        });
        
        // If unauthorized, redirect to login
        if (response.status === 401) {
          console.log('[Users Page] Unauthorized - redirecting to login');
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('[Users Page] Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log('Creating user with data:', formData);

    try {
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Get response text first to see what we're getting
      const responseText = await response.text();
      console.log('Response text:', responseText);

      const parsed = (() => {
        try {
          return responseText ? JSON.parse(responseText) : null;
        } catch {
          return null;
        }
      })();

      if (response.ok) {
        const data = parsed || {};
        console.log('User created:', data);
        setNotification({
          type: 'success',
          message: 'User created successfully!',
        });
        setShowModal(false);
        setFormData({
          email: '',
          password: '',
          full_name: '',
          role: 'client',
          phone: '',
        });
        fetchUsers(); // Refresh list
        setTimeout(() => setNotification(null), 3000);
      } else {
        const data = (parsed && typeof parsed === 'object') ? parsed as { error?: string; details?: string } : null;
        const serverError = data?.error || data?.details || '';
        const fallback = responseText?.trim() ? responseText.trim().slice(0, 220) : '';
        const finalMessage = serverError || fallback || `Failed to create user (HTTP ${response.status})`;

        console.warn(
          `Error creating user (HTTP ${response.status} ${response.statusText}): ${responseText || '[empty response body]'}`
        );
        setNotification({
          type: 'error',
          message: finalMessage,
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Network error:', error);
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLock = (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const action = newStatus === 'suspended' ? 'lock' : 'unlock';
    
    setConfirmDialog({
      show: true,
      userId,
      currentStatus,
      action,
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || '',
    });
    setShowModal(true);
  };

  const handleTogglePasswordLock = (user: User) => {
    setPasswordLockDialog({
      show: true,
      userId: user.id,
      userName: user.full_name,
      currentlyLocked: !!user.password_change_locked,
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth-token');
      const updateData: any = {
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone || null,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      console.log('[Frontend] Updating user:', editingUser.id);
      console.log('[Frontend] Current role:', editingUser.role);
      console.log('[Frontend] New role:', formData.role);
      console.log('[Frontend] Update data:', JSON.stringify(updateData));

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updateData),
        credentials: 'include',
      });

      const responseData = await response.json();
      console.log('[Frontend] Response status:', response.status);
      console.log('[Frontend] Response data:', JSON.stringify(responseData));

      if (response.ok) {
        setNotification({
          type: 'success',
          message: `User updated successfully! Role changed to: ${responseData.user?.role || formData.role}`,
        });
        setShowModal(false);
        setEditingUser(null);
        setFormData({
          email: '',
          password: '',
          full_name: '',
          role: 'client',
          phone: '',
        });
        fetchUsers();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          type: 'error',
          message: responseData.error || 'Failed to update user',
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    setDeleteDialog({
      show: true,
      userId,
      userName,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;
    
    const { userId } = deleteDialog;
    setDeleteDialog(null);

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'User deleted successfully!',
        });
        fetchUsers(); // Refresh list
        setTimeout(() => setNotification(null), 3000);
      } else {
        const data = await response.json();
        setNotification({
          type: 'error',
          message: data.error || 'Failed to delete user',
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const confirmToggleLock = async () => {
    if (!confirmDialog) return;
    
    const { userId, currentStatus } = confirmDialog;
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const action = newStatus === 'suspended' ? 'lock' : 'unlock';
    
    setConfirmDialog(null);

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          message: `Account ${action}ed successfully!`,
        });
        fetchUsers(); // Refresh list
        setTimeout(() => setNotification(null), 3000);
      } else {
        const data = await response.json();
        setNotification({
          type: 'error',
          message: data.error || `Failed to ${action} account`,
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error(`Error ${action}ing account:`, error);
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const confirmTogglePasswordLock = async () => {
    if (!passwordLockDialog) return;

    const { userId, currentlyLocked, userName } = passwordLockDialog;
    const nextLockedState = !currentlyLocked;
    setPasswordLockDialog(null);

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/users/${userId}/password-lock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ locked: nextLockedState }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setNotification({
          type: 'success',
          message: nextLockedState
            ? `Password change locked for ${userName}`
            : `Password change unlocked for ${userName}`,
        });
        fetchUsers();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to update password lock',
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Error toggling password lock:', error);
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'accountant':
        return 'bg-purple-100 text-purple-800';
      case 'consultant':
        return 'bg-blue-100 text-blue-800';
      case 'researcher':
        return 'bg-teal-100 text-teal-800';
      case 'census':
        return 'bg-amber-100 text-amber-800';
      case 'management':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-600">Manage all system users</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
            >
              <Plus size={20} />
              <span>Add User</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <ProfileAvatar userId={user.id} size="sm" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleLock(user.id, user.status)}
                          className={`${user.status === 'suspended' ? 'text-green-600 hover:text-green-900' : 'text-orange-600 hover:text-orange-900'} mr-3`}
                          title={user.status === 'suspended' ? 'Unlock Account' : 'Lock Account'}
                        >
                          {user.status === 'suspended' ? <Unlock size={18} /> : <Lock size={18} />}
                        </button>
                        <button
                          onClick={() => handleTogglePasswordLock(user)}
                          className={`${user.password_change_locked ? 'text-emerald-700 hover:text-emerald-900' : 'text-purple-600 hover:text-purple-900'} mr-3`}
                          title={user.password_change_locked ? 'Allow Password Changes' : 'Stop Password Changes'}
                        >
                          <KeyRound size={18} />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.full_name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </main>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.95) 0%, rgba(209, 250, 229, 0.95) 50%, rgba(167, 243, 208, 0.9) 100%)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-emerald-100">
            <div className="flex justify-between items-center p-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white">
              <h2 className="text-xl font-bold text-emerald-800">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  setFormData({
                    email: '',
                    password: '',
                    full_name: '',
                    role: 'client',
                    phone: '',
                  });
                }}
                className="text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="p-6 space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-semibold text-emerald-800 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all bg-emerald-50/30 placeholder-gray-400"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-emerald-800 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  required={!editingUser}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all bg-emerald-50/30 placeholder-gray-400 disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed"
                  placeholder="user@example.com"
                />
                {editingUser && (
                  <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-emerald-500 rounded-full"></span>
                    Email cannot be changed
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-emerald-800 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all bg-emerald-50/30 placeholder-gray-400"
                  placeholder="+231-555-1234"
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-emerald-800 mb-2">
                  Role *
                </label>
                <select
                  id="role"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all bg-emerald-50/30 cursor-pointer"
                >
                  <option value="client">Client</option>
                  <option value="researcher">Researcher</option>
                  <option value="consultant">Consultant</option>
                  <option value="management">Management (Doctor)</option>
                  <option value="accountant">Accountant</option>
                  <option value="census">Census (Field Worker)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-emerald-800 mb-2">
                  Password {!editingUser && '*'}
                </label>
                <input
                  type="password"
                  id="password"
                  required={!editingUser}
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all bg-emerald-50/30 placeholder-gray-400"
                  placeholder={editingUser ? "Leave blank to keep current password" : "Min. 8 characters"}
                />
                <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-emerald-500 rounded-full"></span>
                  {editingUser ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
                </p>
                {editingUser?.password_changed_at && (
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" />
                    Last changed: {new Date(editingUser.password_changed_at).toLocaleString('en-LR', {
                      dateStyle: 'medium', timeStyle: 'short',
                    })}
                  </p>
                )}
                {editingUser && !editingUser.password_changed_at && (
                  <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" />
                    Password has not been changed since account was created
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-5 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-white text-emerald-700 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 transition-all font-medium shadow-lg shadow-emerald-200"
                >
                  {isSubmitting ? (editingUser ? 'Updating...' : 'Creating...') : (editingUser ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-2xl border-l-4 ${
              notification.type === 'success'
                ? 'bg-white border-green-500'
                : 'bg-white border-red-500'
            }`}
            style={{
              animation: 'slideIn 0.3s ease-out',
              minWidth: '320px',
              maxWidth: '500px',
            }}
          >
            {notification.type === 'success' ? (
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            ) : (
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="text-red-600" size={24} />
              </div>
            )}
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
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Lock/Unlock Confirmation Dialog */}
      {confirmDialog?.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.95) 0%, rgba(209, 250, 229, 0.95) 50%, rgba(167, 243, 208, 0.9) 100%)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all border border-emerald-100">
            <div className="text-center mb-6">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                confirmDialog.action === 'lock' ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                {confirmDialog.action === 'lock' ? (
                  <Lock className="text-orange-600" size={32} />
                ) : (
                  <Unlock className="text-green-600" size={32} />
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {confirmDialog.action === 'lock' ? 'Lock Account?' : 'Unlock Account?'}
              </h3>
              <p className="text-gray-600">
                Are you sure you want to {confirmDialog.action} this user account? 
                {confirmDialog.action === 'lock' && ' The user will not be able to log in.'}
                {confirmDialog.action === 'unlock' && ' The user will be able to log in again.'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleLock}
                className={`flex-1 px-6 py-3 text-white font-semibold rounded-xl transition-all duration-200 ${
                  confirmDialog.action === 'lock'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {confirmDialog.action === 'lock' ? 'Lock Account' : 'Unlock Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Lock Confirmation Dialog */}
      {passwordLockDialog?.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.95) 0%, rgba(209, 250, 229, 0.95) 50%, rgba(167, 243, 208, 0.9) 100%)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all border border-emerald-100">
            <div className="text-center mb-6">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                passwordLockDialog.currentlyLocked ? 'bg-emerald-100' : 'bg-purple-100'
              }`}>
                <KeyRound className={passwordLockDialog.currentlyLocked ? 'text-emerald-700' : 'text-purple-700'} size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {passwordLockDialog.currentlyLocked ? 'Allow Password Changes?' : 'Stop Password Changes?'}
              </h3>
              <p className="text-gray-600">
                {passwordLockDialog.currentlyLocked
                  ? `${passwordLockDialog.userName} will be able to change password again.`
                  : `${passwordLockDialog.userName} will not be able to change password until unlocked.`}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setPasswordLockDialog(null)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmTogglePasswordLock}
                className={`flex-1 px-6 py-3 text-white font-semibold rounded-xl transition-all duration-200 ${
                  passwordLockDialog.currentlyLocked
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-purple-700 hover:bg-purple-800'
                }`}
              >
                {passwordLockDialog.currentlyLocked ? 'Allow Change' : 'Stop Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog?.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.95) 0%, rgba(209, 250, 229, 0.95) 50%, rgba(167, 243, 208, 0.9) 100%)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all border border-emerald-100">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="text-red-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Delete User?
              </h3>
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete <span className="font-semibold">{deleteDialog.userName}</span>?
              </p>
              <p className="text-red-600 text-sm font-medium">
                This action cannot be undone. All user data will be permanently deleted.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteDialog(null)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all duration-200"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideIn {
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
