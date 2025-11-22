'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, Globe, BookOpen, Clock, Award, ArrowLeft } from 'lucide-react';

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
}

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="text-white hover:text-emerald-100"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Our Doctors</h1>
              <p className="text-emerald-100 mt-1">Meet our experienced medical professionals</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12">
            <User size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">No doctors available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Doctor Photo */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 h-48 flex items-center justify-center">
                  {doctor.has_photo ? (
                    <img
                      src={`/api/profile/photo?userId=${doctor.id}`}
                      alt={doctor.full_name}
                      className="w-32 h-32 rounded-full border-4 border-white object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-white flex items-center justify-center">
                      <User size={64} className="text-emerald-700" />
                    </div>
                  )}
                </div>

                {/* Doctor Info */}
                <div className="p-6">
                  {/* Name and Status */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {doctor.full_name || 'Doctor'}
                  </h3>
                  <p className="text-emerald-600 font-medium mb-4">
                    {doctor.status || 'Medical Professional'}
                  </p>

                  {/* Specialization */}
                  {doctor.specialization && (
                    <div className="flex items-start mb-3">
                      <Briefcase size={18} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Specialization</p>
                        <p className="text-sm text-gray-900">{doctor.specialization}</p>
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {doctor.years_of_experience && (
                    <div className="flex items-start mb-3">
                      <Award size={18} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Experience</p>
                        <p className="text-sm text-gray-900">
                          {doctor.years_of_experience} {doctor.years_of_experience === 1 ? 'year' : 'years'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {doctor.languages_spoken && (
                    <div className="flex items-start mb-3">
                      <Globe size={18} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Languages</p>
                        <p className="text-sm text-gray-900">{doctor.languages_spoken}</p>
                      </div>
                    </div>
                  )}

                  {/* Available Hours */}
                  {doctor.available_hours && (
                    <div className="flex items-start mb-3">
                      <Clock size={18} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Available</p>
                        <p className="text-sm text-gray-900">{doctor.available_hours}</p>
                      </div>
                    </div>
                  )}

                  {/* About Dr. Section */}
                  {doctor.bio && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                        <BookOpen size={16} className="mr-2" />
                        About Dr. {doctor.full_name?.split(' ')[0]}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                        {doctor.bio}
                      </p>
                    </div>
                  )}

                  {/* Education */}
                  {doctor.educational_level && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 uppercase mb-1">Education</p>
                      <p className="text-sm text-gray-900 font-medium">{doctor.educational_level}</p>
                      {doctor.university && (
                        <p className="text-sm text-gray-600">{doctor.university}</p>
                      )}
                    </div>
                  )}

                  {/* Research Interests */}
                  {doctor.research_interests && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 uppercase mb-1">Research Interests</p>
                      <p className="text-sm text-gray-600">{doctor.research_interests}</p>
                    </div>
                  )}

                  {/* Certifications */}
                  {doctor.certifications && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 uppercase mb-1">Certifications</p>
                      <p className="text-sm text-gray-600">{doctor.certifications}</p>
                    </div>
                  )}

                  {/* Contact Button */}
                  <button
                    onClick={() => router.push('/contact')}
                    className="w-full mt-6 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
                  >
                    Contact Doctor
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
