'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, EyeOff, Smartphone, Building2, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentSettings {
  // Mobile Money
  mobileMoneyEnabled: boolean;
  orangeMoneyNumber: string;
  orangeMoneyName: string;
  mtnNumber: string;
  mtnName: string;
  
  // Bank Transfer
  bankTransferEnabled: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  branchName: string;
  
  // International
  internationalEnabled: boolean;
  paypalEmail: string;
  wiseEmail: string;
  westernUnionName: string;
  
  // General
  organizationName: string;
}

export default function PaymentSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PaymentSettings>({
    mobileMoneyEnabled: true,
    orangeMoneyNumber: '',
    orangeMoneyName: '',
    mtnNumber: '+231 888 293976',
    mtnName: '',
    
    bankTransferEnabled: false,
    bankName: '',
    accountName: '',
    accountNumber: '',
    swiftCode: '',
    branchName: '',
    
    internationalEnabled: false,
    paypalEmail: '',
    wiseEmail: '',
    westernUnionName: '',
    
    organizationName: 'MedConsult Liberia',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/payment-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        showNotification('success', 'Payment settings saved successfully!');
      } else {
        showNotification('error', 'Failed to save settings');
      }
    } catch (error) {
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
                <p className="text-sm text-gray-600">Manage donation payment methods</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-6 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:bg-gray-400"
            >
              <Save size={20} className="mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-md shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

          {/* General Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">General Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={settings.organizationName}
                onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="MedConsult Liberia"
              />
            </div>
          </div>

          {/* Mobile Money Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Smartphone className="text-orange-600 mr-3" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Mobile Money</h2>
                  <p className="text-sm text-gray-600">Primary payment method in Liberia</p>
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, mobileMoneyEnabled: !settings.mobileMoneyEnabled })}
                className={`flex items-center px-4 py-2 rounded-md font-semibold transition-all ${
                  settings.mobileMoneyEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {settings.mobileMoneyEnabled ? (
                  <>
                    <Eye size={18} className="mr-2" />
                    Enabled
                  </>
                ) : (
                  <>
                    <EyeOff size={18} className="mr-2" />
                    Disabled
                  </>
                )}
              </button>
            </div>

            {settings.mobileMoneyEnabled && (
              <div className="space-y-4">
                {/* Orange Money */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-3">🟠 Orange Money</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={settings.orangeMoneyNumber}
                        onChange={(e) => setSettings({ ...settings, orangeMoneyNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="+231-XXX-XXX-XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={settings.orangeMoneyName}
                        onChange={(e) => setSettings({ ...settings, orangeMoneyName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Your Name"
                      />
                    </div>
                  </div>
                </div>

                {/* MTN Mobile Money */}
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-3">🔵 MTN Mobile Money</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={settings.mtnNumber}
                        onChange={(e) => setSettings({ ...settings, mtnNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="+231-XXX-XXX-XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={settings.mtnName}
                        onChange={(e) => setSettings({ ...settings, mtnName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="Your Name"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bank Transfer Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Building2 className="text-emerald-700 mr-3" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Bank Transfer</h2>
                  <p className="text-sm text-gray-600">For larger donations & organizations</p>
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, bankTransferEnabled: !settings.bankTransferEnabled })}
                className={`flex items-center px-4 py-2 rounded-md font-semibold transition-all ${
                  settings.bankTransferEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {settings.bankTransferEnabled ? (
                  <>
                    <Eye size={18} className="mr-2" />
                    Enabled
                  </>
                ) : (
                  <>
                    <EyeOff size={18} className="mr-2" />
                    Disabled
                  </>
                )}
              </button>
            </div>

            {settings.bankTransferEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={settings.bankName}
                    onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Ecobank Liberia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={settings.accountName}
                    onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Your Account Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={settings.accountNumber}
                    onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Swift Code
                  </label>
                  <input
                    type="text"
                    value={settings.swiftCode}
                    onChange={(e) => setSettings({ ...settings, swiftCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="XXXXXXXX"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={settings.branchName}
                    onChange={(e) => setSettings({ ...settings, branchName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Monrovia Main Branch"
                  />
                </div>
              </div>
            )}
          </div>

          {/* International Payment Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Globe className="text-blue-600 mr-3" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">International Payments</h2>
                  <p className="text-sm text-gray-600">For international donors</p>
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, internationalEnabled: !settings.internationalEnabled })}
                className={`flex items-center px-4 py-2 rounded-md font-semibold transition-all ${
                  settings.internationalEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {settings.internationalEnabled ? (
                  <>
                    <Eye size={18} className="mr-2" />
                    Enabled
                  </>
                ) : (
                  <>
                    <EyeOff size={18} className="mr-2" />
                    Disabled
                  </>
                )}
              </button>
            </div>

            {settings.internationalEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💳 PayPal Email
                  </label>
                  <input
                    type="email"
                    value={settings.paypalEmail}
                    onChange={(e) => setSettings({ ...settings, paypalEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🌍 Wise (TransferWise) Email
                  </label>
                  <input
                    type="email"
                    value={settings.wiseEmail}
                    onChange={(e) => setSettings({ ...settings, wiseEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💵 Western Union Full Name
                  </label>
                  <input
                    type="text"
                    value={settings.westernUnionName}
                    onChange={(e) => setSettings({ ...settings, westernUnionName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your Full Legal Name"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview Link */}
          <div className="bg-emerald-50 rounded-lg p-6 text-center">
            <p className="text-gray-700 mb-4">
              <strong>Preview your donation page:</strong>
            </p>
            <a
              href="/donate"
              target="_blank"
              className="inline-block px-6 py-3 bg-emerald-700 text-white font-semibold rounded-md hover:bg-emerald-800 transition-all"
            >
              View Donation Page
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}
