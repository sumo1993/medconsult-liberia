'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Settings, MessageCircle, Phone, ArrowLeft } from 'lucide-react';

interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description: string;
}

export default function SiteSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    whatsapp_number: '',
    whatsapp_link: '',
    facebook_messenger_link: '',
    facebook_messenger_enabled: 'false',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/site-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        
        // Populate form data
        const settingsMap: any = {};
        data.settings.forEach((setting: Setting) => {
          settingsMap[setting.setting_key] = setting.setting_value;
        });
        setFormData(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToUpdate = Object.keys(formData).map((key) => ({
        key,
        value: formData[key as keyof typeof formData],
      }));

      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsToUpdate }),
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Settings saved successfully!',
        });
        setTimeout(() => setNotification(null), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to save settings. Please try again.',
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="text-emerald-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage social media links and other site configurations
          </p>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* WhatsApp Settings */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex items-center space-x-2 mb-4">
              <MessageCircle className="text-green-500" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">WhatsApp</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={formData.whatsapp_number}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp_number: e.target.value })
                  }
                  placeholder="+231 888 293 976"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Include country code (e.g., +231)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Link
                </label>
                <input
                  type="url"
                  value={formData.whatsapp_link}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp_link: e.target.value })
                  }
                  placeholder="https://wa.me/231888293976"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Format: https://wa.me/[country code][number]
                </p>
              </div>
            </div>
          </div>

          {/* Facebook Messenger Settings */}
          <div className="pb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Phone className="text-blue-500" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">
                Facebook Messenger
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.facebook_messenger_enabled === 'true'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        facebook_messenger_enabled: e.target.checked
                          ? 'true'
                          : 'false',
                      })
                    }
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Facebook Messenger
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook Messenger Link
                </label>
                <input
                  type="url"
                  value={formData.facebook_messenger_link}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      facebook_messenger_link: e.target.value,
                    })
                  }
                  placeholder="https://m.me/your-page-username"
                  disabled={formData.facebook_messenger_enabled === 'false'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Format: https://m.me/[your-page-username]
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Save size={20} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            💡 How to use
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• WhatsApp settings are always active and visible on the site</li>
            <li>
              • Enable Facebook Messenger when you have your page link ready
            </li>
            <li>• Changes take effect immediately after saving</li>
            <li>
              • Make sure to test the links after saving to ensure they work
              correctly
            </li>
          </ul>
        </div>
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
          >
            <div
              className={`flex-shrink-0 ${
                notification.type === 'success'
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}
            >
              {notification.type === 'success' ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <p className="text-gray-900 font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
