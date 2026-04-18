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
        <div className="grid grid-cols-1 items-start gap-10 md:gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-x-14 lg:gap-y-12">
          {/* Copy — first on mobile; full column width on lg for a dominant reading column */}
          <div className="order-1 flex min-w-0 w-full flex-col">
            <div className="w-full max-w-xl text-left sm:max-w-2xl lg:max-w-none">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 sm:text-sm md:text-[0.9375rem]">
                Leadership
              </p>
              <h2
                id="about-heading"
                className="mt-3 text-balance text-slate-900"
              >
                <span className="mb-1 block text-lg font-medium leading-snug text-emerald-700 sm:text-xl md:text-2xl">
                  About
                </span>
                <span className="block bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 bg-clip-text text-[2.125rem] font-bold leading-[1.06] tracking-tight text-transparent sm:text-[2.5rem] md:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
                  {doctor.full_name}
                </span>
              </h2>

              <div className="mt-5 h-px w-28 bg-gradient-to-r from-transparent via-emerald-500 to-transparent md:mt-6 md:w-32" />

              {doctor.status ? (
                <p className="mt-5 inline-flex items-center rounded-lg border border-emerald-200/80 bg-white/90 px-3.5 py-2 text-sm font-medium text-emerald-800 shadow-sm backdrop-blur-sm sm:text-base">
                  <span
                    className="mr-2 inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden
                  />
                  {doctor.status}
                </p>
              ) : null}

              <div
                className="relative mt-6 w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_28px_rgba(15,23,42,0.07)] sm:rounded-3xl sm:p-8 sm:shadow-[0_8px_40px_rgba(15,23,42,0.08)] md:mt-7 md:p-9 lg:p-10"
                lang="en"
              >
                <div
                  className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-teal-500/75"
                  aria-hidden
                />
                <div className="space-y-6 px-5 py-6 text-justify [text-align-last:left] [text-justify:inter-word] hyphens-auto sm:space-y-7 sm:px-7 sm:py-8 md:space-y-8 md:px-8 md:py-9 lg:px-10 lg:py-10">
                  {bodyParagraphs.map((para, i) => (
                    <p
                      key={i}
                      className={`[overflow-wrap:anywhere] antialiased ${
                        i === 0
                          ? 'text-[1.1875rem] font-semibold leading-[1.72] text-slate-900 sm:text-[1.3125rem] sm:leading-[1.74] md:text-[1.4375rem] md:leading-[1.76] lg:text-[1.5rem] lg:leading-[1.78]'
                          : 'text-[1.125rem] font-normal leading-[1.72] text-slate-700 sm:text-[1.25rem] sm:leading-[1.74] md:text-[1.3125rem] md:leading-[1.76] lg:text-[1.375rem] lg:leading-[1.78]'
                      }`}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-4 md:mt-8">
                <button
                  type="button"
                  onClick={handleReadFullBio}
                  className="inline-flex w-full min-h-[3.25rem] items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-600/18 transition duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg md:min-h-[3.5rem] md:text-lg"
                >
                  Read full biography
                </button>
                <button
                  type="button"
                  onClick={handleContactMe}
                  className="inline-flex w-full min-h-[3.25rem] items-center justify-center rounded-full border-2 border-slate-200/90 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-800 md:min-h-[3.5rem] md:text-lg"
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
