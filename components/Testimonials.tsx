'use client';

import { useState, useEffect } from 'react';
import { Star, Quote, User, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { devLogError } from '@/lib/utils';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  rating: number;
  text: string;
  has_photo: boolean;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback testimonials if database is empty
  const defaultTestimonials: Testimonial[] = [
    {
      id: 0,
      name: 'John Doe',
      role: 'Client',
      rating: 5,
      text: 'Excellent service! The consultant was professional and provided clear guidance for my medical concerns.',
      has_photo: false
    },
    {
      id: 0,
      name: 'Jane Smith',
      role: 'Research Client',
      rating: 5,
      text: 'Outstanding research support. Helped me complete my medical thesis with expert insights.',
      has_photo: false
    },
    {
      id: 0,
      name: 'Michael Johnson',
      role: 'Corporate Client',
      rating: 5,
      text: 'Professional and reliable. MedConsult Liberia has been instrumental in our healthcare initiatives.',
      has_photo: false
    },
  ];

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch('/api/testimonials', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.testimonials && data.testimonials.length > 0) {
            setTestimonials(data.testimonials);
          } else {
            setTestimonials(defaultTestimonials);
          }
        } else {
          setTestimonials(defaultTestimonials);
        }
      } catch (error) {
        devLogError('Error fetching testimonials:', error);
        setTestimonials(defaultTestimonials);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;
  
  // Show up to 3 testimonials on the homepage
  const visibleTestimonials = displayTestimonials.slice(0, 3);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleTestimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + visibleTestimonials.length) % visibleTestimonials.length);
  };

  // Auto-advance carousel
  useEffect(() => {
    if (visibleTestimonials.length <= 1) return;
    
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [visibleTestimonials.length]);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/30 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-2/3 mx-auto mb-12"></div>
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/10 rounded-xl p-6 h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Client Testimonials
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-white/95">
            Hear what our clients say about their experience with MedConsult Liberia
          </p>
        </div>

        {/* Desktop Grid View */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 mb-8">
          {visibleTestimonials.map((testimonial, index) => (
            <div
              key={testimonial.id || index}
              className="bg-white rounded-xl shadow-lg p-6 relative transform hover:-translate-y-1 transition-transform duration-300"
            >
              <Quote className="absolute top-4 right-4 text-emerald-200" size={48} />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="text-emerald-500 fill-emerald-500" size={20} />
                ))}
              </div>
              
              {/* Text */}
              <p className="text-gray-700 mb-6 italic line-clamp-4">"{testimonial.text}"</p>
              
              {/* Author */}
              <div className="border-t pt-4 flex items-center gap-3">
                {testimonial.has_photo && testimonial.id ? (
                  <img
                    src={`/api/testimonials/photo?id=${testimonial.id}&t=${Date.now()}`}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-emerald-600" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Carousel View */}
        <div className="md:hidden relative">
          <div className="overflow-hidden rounded-xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {visibleTestimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id || index}
                  className="w-full flex-shrink-0 px-2"
                >
                  <div className="bg-white rounded-xl shadow-lg p-6 relative">
                    <Quote className="absolute top-4 right-4 text-emerald-200" size={40} />
                    
                    {/* Rating */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="text-emerald-500 fill-emerald-500" size={18} />
                      ))}
                    </div>
                    
                    {/* Text */}
                    <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                    
                    {/* Author */}
                    <div className="border-t pt-4 flex items-center gap-3">
                      {testimonial.has_photo && testimonial.id ? (
                        <img
                          src={`/api/testimonials/photo?id=${testimonial.id}&t=${Date.now()}`}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-emerald-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-emerald-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Controls */}
          {visibleTestimonials.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous testimonial"
                className="absolute left-0 top-1/2 flex h-11 w-11 -translate-x-1 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-colors hover:bg-white sm:-translate-x-2"
              >
                <ChevronLeft className="h-5 w-5 text-emerald-600" aria-hidden />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next testimonial"
                className="absolute right-0 top-1/2 flex h-11 w-11 translate-x-1 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-colors hover:bg-white sm:translate-x-2"
              >
                <ChevronRight className="h-5 w-5 text-emerald-600" aria-hidden />
              </button>
            </>
          )}

          {/* Dots Indicator — min 44×44px hit targets for touch / Lighthouse */}
          <div
            className="mt-6 flex flex-wrap justify-center gap-1"
            role="group"
            aria-label="Choose testimonial"
          >
            {visibleTestimonials.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-current={index === currentIndex ? 'true' : undefined}
                aria-label={`Testimonial ${index + 1} of ${visibleTestimonials.length}`}
                onClick={() => setCurrentIndex(index)}
                className="flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span
                  className={`block h-2.5 w-2.5 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>

        {/* View All Link */}
        {displayTestimonials.length > 3 && (
          <div className="text-center mt-8">
            <Link
              href="/testimonials"
              className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-full font-semibold hover:bg-emerald-50 transition-colors"
            >
              View All Testimonials
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}


