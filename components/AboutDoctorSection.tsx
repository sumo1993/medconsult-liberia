'use client';

import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

interface Doctor {
  id: number;
  full_name: string;
  status: string;
  bio: string;
  specialization: string;
  years_of_experience: number;
  has_photo: boolean;
}

export default function AboutDoctorSection() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedDoctor();
  }, []);

  const fetchFeaturedDoctor = async () => {
    try {
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const data = await response.json();
        // Get the first doctor or the one with most experience
        const doctors = data.doctors;
        if (doctors && doctors.length > 0) {
          const featured = doctors.reduce((prev: Doctor, current: Doctor) => 
            (current.years_of_experience > prev.years_of_experience) ? current : prev
          );
          setDoctor(featured);
        }
      }
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadFullBio = () => {
    window.location.href = '/doctors';
  };

  const handleContactMe = () => {
    window.location.href = '/contact';
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!doctor || !doctor.bio) {
    return null;
  }

  const firstName = doctor.full_name?.split(' ')[0] || 'Doctor';

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Text Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block">
                <h2 className="text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  About <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">{firstName}</span>
                </h2>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <div className="h-1.5 w-20 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"></div>
                <p className="text-xl lg:text-2xl text-emerald-700 font-semibold">
                  {doctor.status}
                </p>
              </div>
            </div>
            
            <div className="space-y-6 text-gray-700 text-lg leading-loose pt-2">
              {doctor.bio.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-justify font-light tracking-wide">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <button
                onClick={handleReadFullBio}
                className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
              >
                Read Full Biography
              </button>
              <button
                onClick={handleContactMe}
                className="px-8 py-4 border-2 border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50 hover:border-emerald-700 transition-all duration-300 font-semibold text-lg hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Contact Me
              </button>
            </div>
          </div>

          {/* Right Side - Doctor Photo with Modern Design */}
          <div className="relative lg:order-last order-first mb-8 lg:mb-0">
            {/* Decorative Background Elements */}
            <div className="absolute -top-8 -right-8 w-80 h-80 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full blur-3xl opacity-40 animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-72 h-72 bg-gradient-to-tr from-emerald-200 to-emerald-100 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            {/* Photo Container */}
            <div className="relative z-10">
              <div className="relative bg-gradient-to-br from-emerald-50 to-gray-100 rounded-full overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02] aspect-square max-w-[520px] mx-auto">
                {doctor.has_photo ? (
                  <img
                    src={`/api/profile/photo?userId=${doctor.id}`}
                    alt={doctor.full_name}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-300 flex items-center justify-center">
                    <User size={140} className="text-emerald-600 opacity-50" />
                  </div>
                )}
                
                {/* Name Badge at Bottom with Enhanced Design */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-24 pb-8 px-8">
                  <h3 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
                    {doctor.full_name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="h-1 w-12 bg-emerald-400 rounded-full"></div>
                    <p className="text-emerald-300 text-lg lg:text-xl font-semibold">
                      {doctor.years_of_experience}+ Years Experience
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
