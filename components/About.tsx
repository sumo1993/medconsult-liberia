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
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  useEffect(() => {
    fetchDoctor();
  }, []);

  const fetchDoctor = async () => {
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`/api/doctors/public?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        // Get the first doctor with about_text
        const doctorWithAbout = data.doctors.find((d: Doctor) => d.about_text);
        if (doctorWithAbout) {
          setDoctor(doctorWithAbout);
          setImageTimestamp(Date.now()); // Update timestamp for image
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
    <section id="about" className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-start items-stretch gap-8 md:gap-12 lg:gap-16">
          {/* Text Content: one column width on mobile so body + buttons share the same side margins */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-2xl flex-col md:mx-0 md:max-w-none">
              <h3 className="mb-3 text-balance text-center text-3xl font-bold text-emerald-700 sm:text-4xl md:text-left">
                About {doctor.full_name}
              </h3>
              {doctor.status && (
                <p className="mb-6 text-balance text-center text-lg font-semibold text-emerald-600 sm:text-xl md:text-left">
                  {doctor.status}
                </p>
              )}
              <div className="mb-8 w-full text-pretty text-lg leading-relaxed text-gray-700 max-md:text-justify max-md:hyphens-auto sm:text-xl sm:leading-relaxed md:text-left md:hyphens-none">
                {(() => {
                  const paras = doctor.about_text
                    .split(/\n\n+/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  if (paras.length === 0) {
                    return (
                      <p className="break-words [text-wrap:pretty]">
                        {doctor.about_text}
                      </p>
                    );
                  }
                  return paras.map((para, i) => (
                    <p
                      key={i}
                      className="mb-5 break-words last:mb-0 [text-wrap:pretty] sm:mb-6"
                    >
                      {para}
                    </p>
                  ));
                })()}
              </div>
              <div className="mt-auto flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start sm:gap-4">
                <button
                  type="button"
                  onClick={handleReadFullBio}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-700 px-7 py-4 text-center text-base font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-800 sm:min-w-[12rem] sm:w-auto sm:px-9 sm:py-3.5 sm:text-lg"
                >
                  Read Full Biography
                </button>
                <button
                  type="button"
                  onClick={handleContactMe}
                  className="inline-flex w-full items-center justify-center rounded-lg border-2 border-emerald-700 bg-transparent px-7 py-4 text-center text-base font-semibold text-emerald-700 transition-all hover:bg-emerald-700 hover:text-white sm:min-w-[12rem] sm:w-auto sm:px-9 sm:py-3.5 sm:text-lg"
                >
                  Contact Me
                </button>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="flex min-w-0 flex-1 order-first md:order-last flex items-center justify-center md:pt-1">
            <div className="w-full max-w-md rounded-lg overflow-hidden shadow-lg bg-gray-200">
              {doctor.has_about_photo ? (
                <img
                  src={`/api/about-me/photo?userId=${doctor.id}&t=${imageTimestamp}`}
                  alt={doctor.full_name}
                  className="w-full h-auto max-h-[400px] object-cover object-top"
                  loading="eager"
                />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                  alt="Doctor in consultation"
                  className="w-full h-auto max-h-[400px] object-cover"
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
