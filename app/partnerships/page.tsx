'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Handshake, Building2, TrendingUp, Users, CheckCircle, Mail, X } from 'lucide-react';

export default function PartnershipsPage() {
  const router = useRouter();

  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    logo: '',
    description: '',
    website: '',
    contact_email: '',
    contact_phone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partnerships');
      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPartnership = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/partnerships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowPartnerForm(false);
        setShowSuccessModal(true);
        setFormData({ name: '', type: '', logo: '', description: '', website: '', contact_email: '', contact_phone: '' });
      } else {
        alert('Failed to submit partnership request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting partnership:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Growth Opportunities',
      description: 'Expand your reach and grow your healthcare services'
    },
    {
      icon: Users,
      title: 'Network Access',
      description: 'Connect with healthcare professionals and organizations'
    },
    {
      icon: Building2,
      title: 'Brand Visibility',
      description: 'Increase your organization\'s visibility in the healthcare sector'
    },
  ];

  return (
    <>
      <Header />
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-emerald-600" size={32} />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Application Submitted!
              </h3>
              
              <p className="text-gray-600 mb-6">
                Thank you for your interest in partnering with MedConsult Liberia. 
                We have received your application and will review it shortly. 
                Our team will get back to you within 3-5 business days.
              </p>
              
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors"
              >
                Got it, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <Handshake size={48} />
              <h1 className="text-4xl md:text-5xl font-bold">Partnerships</h1>
            </div>
            <p className="text-xl text-emerald-100 max-w-3xl">
              Building strong partnerships to improve healthcare delivery across Liberia
            </p>
          </div>
        </section>

        {/* Current Partners */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Partners</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              </div>
            ) : partners.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-8">
                {partners.map((partner: any, index: number) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      {partner.logo ? (
                        <img src={partner.logo} alt={partner.name} className="max-h-24 max-w-full object-contain" />
                      ) : (
                        <Building2 className="text-gray-400" size={64} />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{partner.name}</h3>
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                      {partner.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-emerald-300">
                <Handshake className="mx-auto text-emerald-400 mb-6" size={80} />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Looking for Partners</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  We're actively seeking partnerships with healthcare organizations, government agencies, 
                  and international bodies to improve healthcare delivery across Liberia.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setShowPartnerForm(true)}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <Mail size={20} />
                    Submit Application
                  </button>
                  <a
                    href="mailto:info@medconsultliberia.com?subject=Partnership Inquiry"
                    className="px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-all shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <Mail size={20} />
                    Email Us Directly
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Partnership Application Form */}
        {showPartnerForm && (
          <section className="py-16 bg-gray-100">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Partnership Application</h2>
                <form onSubmit={handleSubmitPartnership} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Your organization name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Type *
                      </label>
                      <select
                        required
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Select Type</option>
                        <option value="Government">Government</option>
                        <option value="International">International Organization</option>
                        <option value="Healthcare">Healthcare Provider</option>
                        <option value="NGO">NGO</option>
                        <option value="Private">Private Sector</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="contact@organization.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="+231 XXX XXX XXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="https://www.yourorganization.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo URL (optional)
                    </label>
                    <input
                      type="url"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Tell us about your organization and why you'd like to partner with us..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowPartnerForm(false)}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Prefer to reach out directly?
                    </p>
                    <a
                      href="mailto:info@medconsultliberia.com?subject=Partnership Inquiry"
                      className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-2"
                    >
                      <Mail size={18} />
                      Email us at info@medconsultliberia.com
                    </a>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Partnership Benefits */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Partnership Benefits</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="text-emerald-600" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Partner */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How to Become a Partner</h2>
            <div className="space-y-6">
              {[
                { step: 1, title: 'Submit Interest', description: 'Fill out our partnership inquiry form' },
                { step: 2, title: 'Initial Meeting', description: 'Discuss partnership opportunities and goals' },
                { step: 3, title: 'Agreement', description: 'Review and sign partnership agreement' },
                { step: 4, title: 'Launch', description: 'Begin collaboration and achieve shared goals' },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 bg-white rounded-xl shadow-md p-6">
                  <div className="flex-shrink-0">
                    <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Interested in Partnering?</h2>
            <p className="text-xl text-emerald-100 mb-8">
              Let's work together to improve healthcare in Liberia
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setShowPartnerForm(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-white text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-all shadow-lg inline-flex items-center justify-center gap-2"
              >
                <Mail size={20} />
                Submit Partnership Application
              </button>
              <a
                href="mailto:info@medconsultliberia.com?subject=Partnership Inquiry"
                className="px-8 py-4 bg-emerald-800 text-white rounded-lg font-semibold hover:bg-emerald-900 transition-all shadow-lg inline-flex items-center justify-center gap-2"
              >
                <Mail size={20} />
                Email Us Directly
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
