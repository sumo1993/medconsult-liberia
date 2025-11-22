'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [siteSettings, setSiteSettings] = useState({
    whatsapp_link: 'https://wa.me/231888293976',
    facebook_messenger_link: '',
    facebook_messenger_enabled: 'false',
  });

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const response = await fetch('/api/site-settings');
      if (response.ok) {
        const data = await response.json();
        setSiteSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: data.message || 'Thank you for your message! We will get back to you soon.',
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Failed to submit message. Please try again.',
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-emerald-700 mb-4 relative inline-block">
            Contact Us
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-3 w-20 h-1 bg-emerald-700"></span>
          </h2>
          <p className="text-gray-600 mt-6">Get in touch for appointments, partnerships, or inquiries</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Info */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-emerald-700 mb-6">Contact Information</h3>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <MapPin className="text-emerald-700" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Service Area</h4>
                  <p className="text-gray-600">Online Consultation Services</p>
                  <p className="text-gray-600 text-sm">Serving Liberia Nationwide</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <Phone className="text-emerald-700" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Phone Numbers</h4>
                  <p className="text-gray-600">+231 888 293 976</p>
                  <p className="text-gray-600">+231 770 205 519</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <Mail className="text-emerald-700" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Email Address</h4>
                  <p className="text-gray-600">medconsultliberia@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <Clock className="text-emerald-700" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Availability</h4>
                  <p className="text-gray-600">Online Consultations Available</p>
                  <p className="text-gray-600">Contact us to schedule</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-4">Connect With Us</h4>
              <div className="flex flex-wrap gap-4">
                <a 
                  href={siteSettings.whatsapp_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>Chat on WhatsApp</span>
                </a>
                {siteSettings.facebook_messenger_enabled === 'true' && siteSettings.facebook_messenger_link && (
                  <a 
                    href={siteSettings.facebook_messenger_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-5 py-2.5 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-300 font-medium"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
                    </svg>
                    <span>Chat on Messenger</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-emerald-700 mb-6">Send Us a Message</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="name" className="block font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <div className="mb-5">
                <label htmlFor="email" className="block font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <div className="mb-5">
                <label htmlFor="subject" className="block font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-emerald-700 focus:outline-none"
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="appointment">Book Appointment</option>
                  <option value="partnership">Partnership Inquiry</option>
                  <option value="donation">Donation Information</option>
                  <option value="general">General Inquiry</option>
                </select>
              </div>

              <div className="mb-5">
                <label htmlFor="message" className="block font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-emerald-700 focus:outline-none resize-vertical"
                  required
                ></textarea>
              </div>

              {submitStatus && (
                <div
                  className={`mb-5 p-4 rounded-md ${
                    submitStatus.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {submitStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-8 py-3 bg-emerald-700 text-white font-semibold rounded-md hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
