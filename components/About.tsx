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

  const aboutParagraphs = doctor.about_text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const bodyParagraphs =
    aboutParagraphs.length > 0 ? aboutParagraphs : [doctor.about_text.trim()].filter(Boolean);

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 py-16 sm:py-20 md:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-90"
        aria-hidden
      >
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-teal-100/30 blur-3xl" />
      </div>

      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Copy */}
          <div className="order-2 flex min-w-0 flex-col lg:order-1 lg:col-span-6">
            <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600/90 sm:text-sm">
                Leadership
              </p>
              <h2
                id="about-heading"
                className="mt-3 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.08] md:text-[2.75rem] lg:text-5xl"
              >
                <span className="block text-lg font-medium text-emerald-700 sm:text-xl md:text-2xl">
                  About
                </span>
                <span className="mt-1 block bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 bg-clip-text text-transparent">
                  {doctor.full_name}
                </span>
              </h2>

              <div className="mx-auto mt-5 h-px w-16 bg-gradient-to-r from-transparent via-emerald-500 to-transparent lg:mx-0 lg:w-20" />

              {doctor.status ? (
                <p className="mt-6 inline-flex items-center justify-center rounded-full border border-emerald-200/80 bg-white/80 px-4 py-1.5 text-center text-sm font-medium text-emerald-800 shadow-sm backdrop-blur-sm sm:text-base lg:justify-start">
                  <span
                    className="mr-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden
                  />
                  {doctor.status}
                </p>
              ) : null}

              <div className="mt-8 max-w-prose text-pretty lg:max-w-[44rem]">
                <div className="space-y-6 max-md:text-justify max-md:hyphens-auto md:hyphens-none md:text-left">
                  {bodyParagraphs.map((para, i) => (
                    <p
                      key={i}
                      className={`break-words [text-wrap:pretty] ${
                        i === 0
                          ? 'text-lg font-normal leading-relaxed text-slate-800 sm:text-xl sm:leading-8'
                          : 'text-base font-normal leading-relaxed text-slate-600 sm:text-lg sm:leading-8'
                      }`}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <button
                  type="button"
                  onClick={handleReadFullBio}
                  className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl sm:w-auto sm:min-w-[11rem] sm:text-base"
                >
                  Read full biography
                </button>
                <button
                  type="button"
                  onClick={handleContactMe}
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white/90 px-8 py-3.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-800 sm:w-auto sm:min-w-[11rem] sm:text-base"
                >
                  Contact me
                </button>
              </div>
            </div>
          </div>

          {/* Portrait */}
          <div className="order-1 flex justify-center lg:order-2 lg:col-span-6 lg:justify-end">
            <div className="relative w-full max-w-md">
              <div
                className="absolute -inset-1 rounded-[1.75rem] bg-gradient-to-br from-emerald-400/40 via-teal-300/20 to-transparent opacity-80 blur-sm"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-3xl bg-slate-100 shadow-2xl ring-1 ring-slate-900/5">
                {doctor.has_about_photo ? (
                  <img
                    src={`/api/about-me/photo?userId=${doctor.id}&t=${imageTimestamp}`}
                    alt={doctor.full_name}
                    className="aspect-[3/4] w-full max-h-[min(560px,78vh)] object-cover object-top sm:aspect-[4/5]"
                    loading="eager"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    alt="Doctor in consultation"
                    className="aspect-[3/4] w-full max-h-[min(560px,78vh)] object-cover object-center sm:aspect-[4/5]"
                    loading="eager"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
