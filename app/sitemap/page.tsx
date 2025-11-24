'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Home, Info, Briefcase, Handshake, BookOpen, MessageSquare, Users, Award, FileText, Map } from 'lucide-react';

export default function SitemapPage() {
  const router = useRouter();

  const sections = [
    {
      title: 'Main Pages',
      icon: Home,
      links: [
        { name: 'Home', path: '/' },
        { name: 'About Us', path: '/about' },
        { name: 'Services', path: '/#services' },
        { name: 'Contact', path: '/#contact' },
      ]
    },
    {
      title: 'Resources',
      icon: BookOpen,
      links: [
        { name: 'Research Library', path: '/research' },
        { name: 'Health Resources', path: '/health-resources' },
        { name: 'Testimonials', path: '/testimonials' },
        { name: 'Partnerships', path: '/partnerships' },
      ]
    },
    {
      title: 'User Portals',
      icon: Users,
      links: [
        { name: 'Login', path: '/login' },
        { name: 'Register', path: '/register' },
        { name: 'Client Dashboard', path: '/dashboard/client' },
        { name: 'Consultant Portal', path: '/dashboard/management' },
      ]
    },
    {
      title: 'Support',
      icon: MessageSquare,
      links: [
        { name: 'Donate', path: '/donate' },
        { name: 'Consultants', path: '/doctors' },
        { name: 'Forgot Password', path: '/forgot-password' },
      ]
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <Map size={48} />
              <h1 className="text-4xl md:text-5xl font-bold">Site Map</h1>
            </div>
            <p className="text-xl text-gray-300">
              Navigate through all pages and sections of MedConsult Liberia
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {sections.map((section, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <section.icon className="text-emerald-600" size={24} />
                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <ul className="space-y-2">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <button
                          onClick={() => router.push(link.path)}
                          className="text-gray-600 hover:text-emerald-600 transition-colors"
                        >
                          → {link.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
