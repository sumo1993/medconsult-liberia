'use client';

import { useEffect, useState } from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
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
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* About Column */}
          <div>
            <h3 className="text-emerald-500 text-xl font-semibold mb-5">
              MedConsult Liberia
            </h3>
            <p className="text-gray-400 mb-5">
              Providing expert medical consultation and healthcare solutions in Monrovia and throughout Liberia.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={siteSettings.whatsapp_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 border-2 border-green-500 text-green-400 rounded-lg hover:bg-green-500/10 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="font-medium">WhatsApp</span>
              </a>
              {siteSettings.facebook_messenger_enabled === 'true' && siteSettings.facebook_messenger_link && (
                <a
                  href={siteSettings.facebook_messenger_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 border-2 border-blue-500 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
                  </svg>
                  <span className="font-medium">Messenger</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-emerald-500 text-xl font-semibold mb-5">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="/" className="text-gray-400 hover:text-emerald-500 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-400 hover:text-emerald-500 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="/partnerships" className="text-gray-400 hover:text-emerald-500 transition-colors">
                  Partnerships
                </a>
              </li>
              <li>
                <a href="/research" className="text-gray-400 hover:text-emerald-500 transition-colors">
                  Research
                </a>
              </li>
              <li>
                <a href="/health-resources" className="text-gray-400 hover:text-emerald-500 transition-colors">
                  Health Resources
                </a>
              </li>
              <li>
                <a href="/testimonials" className="text-gray-400 hover:text-emerald-500 transition-colors">
                  Testimonials
                </a>
              </li>
              <li>
                <a href="/sitemap" className="text-gray-400 hover:text-emerald-500 transition-colors">
                  Sitemap
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-emerald-500 text-xl font-semibold mb-5">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="text-emerald-500 mr-3 mt-1 flex-shrink-0" size={18} />
                <span className="text-gray-400">Online Consultation Services<br />Serving Liberia Nationwide</span>
              </li>
              <li className="flex items-start">
                <Phone className="text-emerald-500 mr-3 mt-1 flex-shrink-0" size={18} />
                <div className="text-gray-400">
                  <div>+231 888 293 976</div>
                  <div>+231 770 205 519</div>
                </div>
              </li>
              <li className="flex items-start">
                <Mail className="text-emerald-500 mr-3 mt-1 flex-shrink-0" size={18} />
                <span className="text-gray-400">medconsultliberia@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Partnership Banner - SunRise African Rentals */}
        <div className="border-t border-gray-800 pt-8 pb-6">
          <div className="bg-gray-800 border-2 border-gray-700 rounded-xl p-6 mb-6 hover:border-emerald-500 transition-all duration-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="text-2xl">🪑</span>
                  <h4 className="text-white text-lg font-semibold">
                    Need Event Rentals in Monrovia?
                  </h4>
                </div>
                <p className="text-gray-400 text-sm md:text-base">
                  Chairs, tables, canopy & more • Partner with <span className="text-emerald-400 font-semibold">SunRise African Rentals</span>
                </p>
              </div>
              <a
                href="https://www.sunriseafricanrentals.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-emerald-500 transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap text-sm"
              >
                Visit Website →
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            &copy; 2023 MedConsult Liberia. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
