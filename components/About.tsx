'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { devLogError } from '@/lib/utils';

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
      devLogError('Error fetching doctor:', error);
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
      className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-90"
        aria-hidden
      >
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-teal-100/30 blur-3xl" />
      </div>

      {/* Centered content rail: ~1152px max, equal horizontal padding, vertical rhythm */}
      <div className="relative mx-auto w-full max-w-[1152px] px-4 py-10 md:px-5 md:py-[60px] lg:px-5">
        <div className="grid grid-cols-1 items-center gap-10 md:gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-[60px]">
          {/* Copy — first on mobile */}
          <div className="order-1 flex min-w-0 w-full flex-col">
            {/* One shared max-width so heading, copy, and actions share the same right edge */}
            <div className="w-full max-w-xl text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[2px] text-emerald-600/85 sm:text-xs">
                Leadership
              </p>
              <h2
                id="about-heading"
                className="mt-2 text-balance text-slate-900"
              >
                <span className="mb-1 block text-base font-medium leading-snug text-emerald-700 sm:text-lg">
                  About
                </span>
                <span className="block bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 bg-clip-text text-[1.75rem] font-bold leading-tight tracking-tight text-transparent sm:text-4xl md:text-[2.5rem] lg:text-[2.75rem]">
                  {doctor.full_name}
                </span>
              </h2>

              <div className="mt-4 h-px w-16 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

              {doctor.status ? (
                <p className="mt-5 inline-flex items-center rounded-lg border border-emerald-200/70 bg-white/85 px-3 py-1 text-sm font-medium text-emerald-800 shadow-sm backdrop-blur-sm">
                  <span
                    className="mr-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden
                  />
                  {doctor.status}
                </p>
              ) : null}

              <div
                className="mt-6 w-full rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-6"
                lang="en"
              >
                <div className="space-y-5 text-left">
                  {bodyParagraphs.map((para, i) => (
                    <p
                      key={i}
                      className={`text-pretty [overflow-wrap:anywhere] text-[0.9375rem] font-normal leading-[1.8] tracking-[0.01em] text-slate-700 antialiased sm:text-[1.0625rem] sm:leading-[1.78] ${
                        i === 0 ? 'text-slate-800' : 'text-slate-600'
                      }`}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleReadFullBio}
                  className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-9 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/15 transition duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg sm:w-auto sm:min-w-[11.5rem] sm:text-[15px]"
                >
                  Read full biography
                </button>
                <button
                  type="button"
                  onClick={handleContactMe}
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white/90 px-8 py-3.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-800 sm:w-auto sm:min-w-[11rem]"
                >
                  Contact me
                </button>
              </div>
            </div>
          </div>

          {/* Portrait — below text on mobile */}
          <div className="order-2 flex w-full justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-none">
              <div
                className="absolute -inset-0.5 rounded-[18px] bg-gradient-to-br from-emerald-400/35 via-teal-300/15 to-transparent opacity-80 blur-sm"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-[18px] bg-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-slate-900/[0.06]">
                {doctor.has_about_photo ? (
                  <img
                    src={`/api/about-me/photo?userId=${doctor.id}&t=${imageTimestamp}`}
                    alt={doctor.full_name}
                    className="aspect-[3/4] w-full max-w-full max-h-[min(520px,72vh)] object-cover object-top sm:aspect-[4/5] lg:max-h-[min(560px,78vh)]"
                    loading="eager"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    alt="Doctor in consultation"
                    className="aspect-[3/4] w-full max-w-full max-h-[min(520px,72vh)] object-cover object-center sm:aspect-[4/5] lg:max-h-[min(560px,78vh)]"
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
