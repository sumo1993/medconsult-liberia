'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Doctor {
  id: number;
  full_name: string;
  about_text: string;
  has_about_photo: boolean;
  status: string;
}

export default function About() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctor();
  }, []);

  const fetchDoctor = async () => {
    try {
      const response = await fetch('/api/doctors/public');
      if (response.ok) {
        const data = await response.json();
        // Get the first doctor with about_text
        const doctorWithAbout = data.doctors.find((d: Doctor) => d.about_text);
        if (doctorWithAbout) {
          setDoctor(doctorWithAbout);
        }
      }
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadFullBio = () => {
    router.push('/doctors');
  };

  const handleContactMe = () => {
    // Scroll to contact section on homepage
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If not on homepage, navigate to homepage with hash
      router.push('/#contact');
    }
  };

  if (loading || !doctor || !doctor.about_text) {
    return null; // Don't show section if no data
  }

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Text Content */}
          <div className="flex-1">
            <h3 className="text-3xl font-bold text-emerald-700 mb-2 text-center">
              About {doctor.full_name}
            </h3>
            {doctor.status && (
              <p className="text-lg text-emerald-600 font-semibold mb-6 text-center">
                {doctor.status}
              </p>
            )}
            <div className="text-gray-700 mb-6 whitespace-pre-wrap text-justify">
              {doctor.about_text}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleReadFullBio}
                className="inline-block px-8 py-3 bg-emerald-700 text-white font-semibold rounded-md hover:bg-emerald-800 transition-all hover:-translate-y-1 text-center"
              >
                Read Full Biography
              </button>
              <button
                onClick={handleContactMe}
                className="inline-block px-8 py-3 bg-transparent border-2 border-emerald-700 text-emerald-700 font-semibold rounded-md hover:bg-emerald-700 hover:text-white transition-all text-center"
              >
                Contact Me
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 order-first md:order-last">
            <div className="rounded-lg overflow-hidden shadow-lg bg-gray-200">
              {doctor.has_about_photo ? (
                <img
                  src={`/api/about-me/photo?userId=${doctor.id}`}
                  alt={doctor.full_name}
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                  alt="Doctor in consultation"
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
