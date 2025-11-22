'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Smartphone, Building2, Globe, Heart, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PaymentSettings {
  mobileMoneyEnabled: boolean;
  orangeMoneyNumber: string;
  orangeMoneyName: string;
  mtnNumber: string;
  mtnName: string;
  bankTransferEnabled: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  branchName: string;
  internationalEnabled: boolean;
  paypalEmail: string;
  wiseEmail: string;
  westernUnionName: string;
  organizationName: string;
}

export default function DonatePage() {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    amount: '',
    message: '',
  });

  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    try {
      const response = await fetch('/api/payment-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/donation-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Thank you! We will contact you shortly about your donation.');
        setShowContactForm(false);
        setFormData({ name: '', email: '', phone: '', amount: '', message: '' });
      } else {
        alert(data.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const suggestedAmounts = [10, 25, 50, 100, 250, 500];

  if (loading || !settings) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment options...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        {/* Hero Section */}
        <section className="bg-emerald-700 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </button>
            <div className="text-center max-w-3xl mx-auto">
              <Heart size={64} className="mx-auto mb-6" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Support Healthcare in Liberia
              </h1>
              <p className="text-xl text-emerald-100">
                Your donation helps us provide quality medical care, conduct vital research, 
                and improve public health across Liberia.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-5xl mx-auto">
            
            {/* Impact Section */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Your Impact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-emerald-700 mb-2">$10</div>
                  <p className="text-gray-600">Provides basic medical supplies for one patient</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-emerald-700 mb-2">$50</div>
                  <p className="text-gray-600">Supports a community health education session</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-emerald-700 mb-2">$100</div>
                  <p className="text-gray-600">Funds medical equipment for our clinic</p>
                </div>
              </div>
            </div>

            {/* Suggested Amounts */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Suggested Donation Amounts
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {suggestedAmounts.map((amount) => (
                  <button
                    key={amount}
                    className="p-4 border-2 border-emerald-700 text-emerald-700 rounded-lg font-bold text-xl hover:bg-emerald-700 hover:text-white transition-all"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <p className="text-center text-gray-600 mt-4">
                Or donate any amount that works for you
              </p>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Mobile Money - PRIMARY */}
              {settings.mobileMoneyEnabled && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <Smartphone className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Mobile Money</h3>
                    <p className="text-xs text-orange-600 font-semibold">⭐ FASTEST & EASIEST</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Orange Money */}
                  {settings.orangeMoneyNumber && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-10 w-10 bg-black rounded flex items-center justify-center p-1">
                          <svg viewBox="0 0 200 100" className="w-full h-full">
                            <path d="M20 30 L40 50 L20 70 L30 70 L50 50 L30 30 Z" fill="white"/>
                            <path d="M60 30 L80 50 L60 70 L70 70 L90 50 L70 30 Z" fill="#FF6600"/>
                            <text x="100" y="45" fill="white" fontSize="20" fontWeight="bold">Orange</text>
                            <text x="100" y="65" fill="white" fontSize="20" fontWeight="bold">Money</text>
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-900">Orange Money</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(settings.orangeMoneyNumber, 'orange')}
                        className="flex items-center text-sm text-orange-600 hover:text-orange-700"
                      >
                        {copiedField === 'orange' ? (
                          <>
                            <Check size={16} className="mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} className="mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-2xl font-mono font-bold text-gray-900">{settings.orangeMoneyNumber}</p>
                    <p className="text-sm text-gray-600 mt-2">Name: {settings.orangeMoneyName || 'Update in settings'}</p>
                  </div>
                  )}

                  {/* MTN Mobile Money */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <img 
                          src="https://findmoreafrica.com/wp-content/uploads/2024/12/OIP.webp" 
                          alt="MTN Mobile Money" 
                          className="h-8 w-8 object-contain"
                        />
                        <span className="font-semibold text-gray-900">MTN Mobile Money</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(settings.mtnNumber, 'mtn')}
                        className="flex items-center text-sm text-yellow-600 hover:text-yellow-700"
                      >
                        {copiedField === 'mtn' ? (
                          <>
                            <Check size={16} className="mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} className="mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-2xl font-mono font-bold text-gray-900">{settings.mtnNumber}</p>
                    <p className="text-sm text-gray-600 mt-2">Name: {settings.mtnName || 'Update in settings'}</p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>How to send:</strong> Dial your mobile money code, select "Send Money", 
                      enter the number above, and confirm the amount.
                    </p>
                  </div>
                </div>
              </div>
              )}

              {/* Bank Transfer */}
              {settings.bankTransferEnabled && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <Building2 className="text-emerald-700" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Bank Transfer</h3>
                    <p className="text-xs text-gray-600">For larger donations</p>
                  </div>
                </div>

                <div className="bg-emerald-50 p-6 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Bank Name:</span>
                    <span className="font-mono font-bold text-gray-900">{settings.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Account Name:</span>
                    <span className="font-mono font-bold text-gray-900">{settings.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Account Number:</span>
                    <div className="flex items-center">
                      <span className="font-mono font-bold text-gray-900 mr-2">{settings.accountNumber}</span>
                      <button
                        onClick={() => copyToClipboard(settings.accountNumber, 'bank')}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        {copiedField === 'bank' ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Swift Code:</span>
                    <span className="font-mono font-bold text-gray-900">{settings.swiftCode}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Branch:</span>
                    <span className="font-mono font-bold text-gray-900">{settings.branchName}</span>
                  </div>
                </div>
              </div>
              )}

              {/* International Payments */}
              {settings.internationalEnabled && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Globe className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">International</h3>
                    <p className="text-xs text-gray-600">For international donors</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">💳 PayPal</span>
                      <button
                        onClick={() => copyToClipboard(settings.paypalEmail, 'paypal')}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        {copiedField === 'paypal' ? (
                          <>
                            <Check size={16} className="mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} className="mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-gray-900">{settings.paypalEmail}</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <span className="font-semibold text-gray-900">🌍 Wise (TransferWise)</span>
                    <p className="text-sm text-gray-600 mt-2">Low fees for international transfers</p>
                    <p className="text-sm text-gray-600">Email: {settings.wiseEmail}</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <span className="font-semibold text-gray-900">💵 Western Union</span>
                    <p className="text-sm text-gray-600 mt-2">
                      Name: {settings.westernUnionName}<br />
                      Location: Monrovia, Liberia
                    </p>
                  </div>
                </div>
              </div>
              )}

            </div>

            {/* Large Donations Contact */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-xl shadow-lg p-8 mt-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">Planning a Large Donation?</h3>
              <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
                For donations over $1,000, institutional partnerships, or if you'd like to discuss 
                how your contribution will be used, please contact us directly.
              </p>
              <button
                onClick={() => setShowContactForm(!showContactForm)}
                className="px-8 py-3 bg-white text-emerald-700 font-semibold rounded-md hover:bg-emerald-50 transition-all"
              >
                {showContactForm ? 'Hide Contact Form' : 'Contact Us About Large Donation'}
              </button>
            </div>

            {/* Contact Form */}
            {showContactForm && (
              <div className="bg-white rounded-xl shadow-lg p-8 mt-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Large Donation Inquiry</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Intended Donation Amount (USD)
                      </label>
                      <input
                        type="text"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="e.g., $1,000"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your donation goals or any questions you have..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-emerald-700 text-white font-semibold rounded-md hover:bg-emerald-800 transition-all"
                  >
                    Send Inquiry
                  </button>
                </form>
              </div>
            )}

            {/* Thank You Message */}
            <div className="bg-emerald-50 rounded-xl p-8 mt-8 text-center">
              <Heart className="mx-auto text-emerald-700 mb-4" size={48} />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Thank You for Your Support!</h3>
              <p className="text-gray-700 max-w-2xl mx-auto">
                Every donation, no matter the size, makes a real difference in improving healthcare 
                access and outcomes in Liberia. Your generosity helps us continue our mission of 
                providing quality medical care to those who need it most.
              </p>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
