'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, Phone, Linkedin, Facebook, Users } from 'lucide-react';

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      console.log('[Team Page] Fetching team members...');
      const response = await fetch('/api/team-members', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      console.log('[Team Page] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Team Page] Received members:', data.length);
        setMembers(data);
      } else {
        console.error('[Team Page] Failed to fetch:', await response.text());
      }
    } catch (error) {
      console.error('[Team Page] Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <Users size={48} />
              <h1 className="text-4xl md:text-5xl font-bold">Our Team</h1>
            </div>
            <p className="text-xl text-emerald-100 max-w-3xl">
              Meet the dedicated professionals committed to providing exceptional healthcare consultation services across Liberia
            </p>
          </div>
        </section>

        {/* Team Members Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading team members...</p>
              </div>
            ) : members.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {members.map((member) => (
                  <div key={member.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    {/* Photo */}
                    <div className="relative h-64 bg-gradient-to-br from-emerald-100 to-teal-100">
                      {member.photo ? (
                        <img 
                          src={member.photo} 
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users size={80} className="text-emerald-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{member.name}</h3>
                      <p className="text-emerald-600 font-semibold mb-2">{member.role}</p>
                      
                      {member.specialization && (
                        <p className="text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                          {member.specialization}
                        </p>
                      )}

                      {member.bio && (
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {member.bio}
                        </p>
                      )}

                      {/* Contact Info */}
                      {(member.email || member.phone || member.linkedin || member.facebook) && (
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                          {member.email && (
                            <a 
                              href={`mailto:${member.email}`}
                              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm"
                              title="Email"
                            >
                              <Mail size={16} />
                              <span className="hidden sm:inline">Email</span>
                            </a>
                          )}
                          {member.phone && (
                            <a 
                              href={`tel:${member.phone}`}
                              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm"
                              title="Phone"
                            >
                              <Phone size={16} />
                              <span className="hidden sm:inline">Call</span>
                            </a>
                          )}
                          {member.linkedin && (
                            <a 
                              href={member.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                              title="LinkedIn"
                            >
                              <Linkedin size={16} />
                            </a>
                          )}
                          {member.facebook && (
                            <a 
                              href={member.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                              title="Facebook"
                            >
                              <Facebook size={16} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Team Members Yet</h3>
                <p className="text-gray-600">Our team information will be available soon.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Join Our Team</h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              We're always looking for talented healthcare professionals to join our mission
            </p>
            <a
              href="mailto:info@medconsultliberia.com?subject=Career Inquiry"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-all shadow-lg"
            >
              <Mail size={20} />
              Get in Touch
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
