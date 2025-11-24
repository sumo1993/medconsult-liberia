'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, Globe, BookOpen, Clock, Award, ArrowLeft, X, Mail, Phone } from 'lucide-react';

interface Doctor {
  id: number;
  email: string;
  full_name: string;
  status: string;
  educational_level: string;
  university: string;
  bio: string;
  specialization: string;
  years_of_experience: number;
  languages_spoken: string;
  research_interests: string;
  available_hours: string;
  certifications: string;
  has_photo: boolean;
  has_profile_photo: boolean;
  about_text: string;
  has_about_photo: boolean;
}

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showBioModal, setShowBioModal] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors/public');
      if (response.ok) {
        const data = await response.json();
        // Filter to only show lead consultant (not System Administrator)
        const filteredDoctors = data.doctors.filter((doc: Doctor) => 
          doc.status !== 'System Administrator' && doc.status !== 'Medical Professional'
        );
        setDoctors(filteredDoctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadFullBio = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBioModal(true);
  };

  const handleContactDoctor = (doctor: Doctor) => {
    // Navigate to homepage contact section with doctor name
    router.push(`/#contact`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="text-white hover:text-emerald-100 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-4xl font-bold">Meet Our Lead Consultant</h1>
              <p className="text-emerald-100 mt-2 text-lg">
                Expert medical consultation services dedicated to your health
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <User size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">No doctors available at the moment</p>
            <p className="text-gray-400 text-sm mt-2">Please check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Doctor Photo */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 h-56 flex items-center justify-center relative">
                  {doctor.has_about_photo ? (
                    <img
                      src={`/api/about-me/photo?userId=${doctor.id}`}
                      alt={doctor.full_name}
                      className="w-36 h-36 rounded-full border-4 border-white object-cover shadow-xl"
                    />
                  ) : doctor.has_profile_photo ? (
                    <img
                      src={`/api/profile/photo?userId=${doctor.id}`}
                      alt={doctor.full_name}
                      className="w-36 h-36 rounded-full border-4 border-white object-cover shadow-xl"
                    />
                  ) : (
                    <div className="w-36 h-36 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-xl">
                      <User size={72} className="text-emerald-700" />
                    </div>
                  )}
                </div>

                {/* Doctor Info */}
                <div className="p-6">
                  {/* Name and Status */}
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {doctor.full_name || 'Doctor'}
                    </h3>
                    <p className="text-emerald-600 font-semibold text-lg">
                      {doctor.status || 'Medical Professional'}
                    </p>
                  </div>

                  {/* Quick Info */}
                  <div className="space-y-3 mb-4">
                    {doctor.specialization && (
                      <div className="flex items-center">
                        <Briefcase size={18} className="text-emerald-600 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{doctor.specialization}</span>
                      </div>
                    )}

                    {doctor.years_of_experience && (
                      <div className="flex items-center">
                        <Award size={18} className="text-emerald-600 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">
                          {doctor.years_of_experience} {doctor.years_of_experience === 1 ? 'year' : 'years'} experience
                        </span>
                      </div>
                    )}

                    {doctor.languages_spoken && (
                      <div className="flex items-center">
                        <Globe size={18} className="text-emerald-600 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{doctor.languages_spoken}</span>
                      </div>
                    )}

                    {doctor.available_hours && (
                      <div className="flex items-center">
                        <Clock size={18} className="text-emerald-600 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{doctor.available_hours}</span>
                      </div>
                    )}
                  </div>

                  {/* About Dr. Section */}
                  {doctor.about_text && (
                    <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-bold text-emerald-900 mb-2 flex items-center">
                        <BookOpen size={16} className="mr-2" />
                        About {doctor.full_name?.split(' ')[0]}
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                        {doctor.about_text}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    {doctor.about_text && (
                      <button
                        onClick={() => handleReadFullBio(doctor)}
                        className="w-full px-4 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors font-semibold shadow-md"
                      >
                        Read Full Biography
                      </button>
                    )}
                    <button
                      onClick={() => handleContactDoctor(doctor)}
                      className="w-full px-4 py-3 border-2 border-emerald-700 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors font-semibold"
                    >
                      Contact Me
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Full Biography Modal */}
      {showBioModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {selectedDoctor.has_photo ? (
                  <img
                    src={`/api/profile/photo?userId=${selectedDoctor.id}`}
                    alt={selectedDoctor.full_name}
                    className="w-16 h-16 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-white bg-white flex items-center justify-center">
                    <User size={32} className="text-emerald-700" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{selectedDoctor.full_name}</h2>
                  <p className="text-emerald-100">{selectedDoctor.status}</p>
                </div>
              </div>
              <button
                onClick={() => setShowBioModal(false)}
                className="text-white hover:text-emerald-100 transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <h3 className="text-2xl font-bold text-emerald-700 mb-4">
                About {selectedDoctor.full_name?.split(' ')[0]}
              </h3>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                  {selectedDoctor.about_text}
                </p>
              </div>

              {/* Additional Info */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedDoctor.educational_level && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Education</h4>
                    <p className="text-gray-700">{selectedDoctor.educational_level}</p>
                    {selectedDoctor.university && (
                      <p className="text-gray-600 text-sm mt-1">{selectedDoctor.university}</p>
                    )}
                  </div>
                )}

                {selectedDoctor.specialization && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Specialization</h4>
                    <p className="text-gray-700">{selectedDoctor.specialization}</p>
                  </div>
                )}

                {selectedDoctor.years_of_experience && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Experience</h4>
                    <p className="text-gray-700">
                      {selectedDoctor.years_of_experience} {selectedDoctor.years_of_experience === 1 ? 'year' : 'years'}
                    </p>
                  </div>
                )}

                {selectedDoctor.languages_spoken && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Languages</h4>
                    <p className="text-gray-700">{selectedDoctor.languages_spoken}</p>
                  </div>
                )}

                {selectedDoctor.research_interests && (
                  <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Research Interests</h4>
                    <p className="text-gray-700">{selectedDoctor.research_interests}</p>
                  </div>
                )}

                {selectedDoctor.certifications && (
                  <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Certifications</h4>
                    <p className="text-gray-700">{selectedDoctor.certifications}</p>
                  </div>
                )}
              </div>

              {/* Contact Button */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => handleContactDoctor(selectedDoctor)}
                  className="px-8 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors font-semibold shadow-lg flex items-center space-x-2"
                >
                  <Mail size={20} />
                  <span>Contact {selectedDoctor.full_name?.split(' ')[0]}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
