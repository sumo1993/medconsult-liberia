'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Award, Target, Users, Heart, TrendingUp, Globe, Mail, Phone, Linkedin, Facebook } from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team-members', {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoadingTeam(false);
    }
  };

  const milestones = [
    { year: '2020', title: 'Founded', description: 'MedConsult Liberia was established' },
    { year: '2021', title: 'First 100 Clients', description: 'Reached milestone of serving 100 clients' },
    { year: '2022', title: 'Expanded Services', description: 'Added research and consultation services' },
    { year: '2023', title: 'Digital Platform', description: 'Launched online consultation platform' },
    { year: '2024', title: 'Growing Impact', description: 'Serving hundreds of clients nationwide' },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About MedConsult Liberia</h1>
            <p className="text-xl text-emerald-100 max-w-3xl">
              Providing expert medical consultation and healthcare solutions across Liberia with dedication, 
              professionalism, and compassion.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="text-emerald-600" size={32} />
                  <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  To provide accessible, high-quality medical consultation services to individuals and 
                  organizations across Liberia, bridging the gap between healthcare needs and expert 
                  medical guidance through innovative digital solutions.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="text-emerald-600" size={32} />
                  <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  To become Liberia's leading medical consultation platform, recognized for excellence 
                  in healthcare delivery, research contribution, and positive impact on public health 
                  outcomes across the nation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Core Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="text-emerald-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Compassion</h3>
                <p className="text-gray-600">
                  We care deeply about every client's health and wellbeing
                </p>
              </div>

              <div className="text-center">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="text-emerald-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Excellence</h3>
                <p className="text-gray-600">
                  We maintain the highest standards in all our services
                </p>
              </div>

              <div className="text-center">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-emerald-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Innovation</h3>
                <p className="text-gray-600">
                  We embrace technology to improve healthcare delivery
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="prose prose-lg text-gray-700">
                <p className="mb-4">
                  MedConsult Liberia was founded with a simple yet powerful vision: to make quality 
                  medical consultation accessible to everyone in Liberia, regardless of their location 
                  or circumstances.
                </p>
                <p className="mb-4">
                  Starting as a small practice in Monrovia, we recognized the challenges many Liberians 
                  face in accessing expert medical advice. Through dedication and innovation, we've grown 
                  into a trusted platform connecting clients with experienced medical consultants.
                </p>
                <p>
                  Today, we serve hundreds of clients across Liberia, providing consultations, research 
                  support, and healthcare guidance. Our digital platform has made it easier than ever to 
                  get the medical expertise you need, when you need it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Journey</h2>
            <div className="max-w-3xl mx-auto">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-4 mb-8 last:mb-0">
                  <div className="flex-shrink-0">
                    <div className="bg-emerald-600 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold">
                      {milestone.year}
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Team</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Meet the dedicated professionals committed to providing exceptional healthcare consultation services
              </p>
            </div>
            
            {loadingTeam ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading team members...</p>
              </div>
            ) : teamMembers.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {teamMembers.map((member) => (
                  <div key={member.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100">
                    {/* Photo - Rounded */}
                    <div className="relative p-6 pb-0 flex justify-center">
                      {member.photo ? (
                        <img 
                          src={member.photo} 
                          alt={member.name}
                          className="w-48 h-48 rounded-full object-cover border-4 border-emerald-100"
                        />
                      ) : (
                        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center border-4 border-emerald-100">
                          <Users size={60} className="text-emerald-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-6 text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                      <p className="text-emerald-600 font-semibold mb-2">{member.role}</p>
                      
                      {member.specialization && (
                        <p className="text-sm text-gray-600 mb-3 pb-3 border-b border-gray-200">
                          {member.specialization}
                        </p>
                      )}

                      {member.bio && (
                        <p className="text-gray-700 text-sm mb-4 leading-relaxed text-left">
                          {member.bio}
                        </p>
                      )}

                      {/* Contact Info - Show actual email and phone */}
                      <div className="space-y-2 pt-3 border-t border-gray-200">
                        {member.email && (
                          <a 
                            href={`mailto:${member.email}`}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm"
                          >
                            <Mail size={16} />
                            <span className="break-all">{member.email}</span>
                          </a>
                        )}
                        {member.phone && (
                          <a 
                            href={`tel:${member.phone}`}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm"
                          >
                            <Phone size={16} />
                            <span>{member.phone}</span>
                          </a>
                        )}
                        {(member.linkedin || member.facebook) && (
                          <div className="flex gap-2 justify-center pt-2">
                            {member.linkedin && (
                              <a 
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
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
                                className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                                title="Facebook"
                              >
                                <Facebook size={16} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">Team information will be available soon.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of satisfied clients who trust MedConsult Liberia for their healthcare needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/register')}
                className="px-8 py-4 bg-white text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-all shadow-lg"
              >
                Get Started Today
              </button>
              <button
                onClick={() => router.push('/contact')}
                className="px-8 py-4 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-800 transition-all shadow-lg"
              >
                Contact Us
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
