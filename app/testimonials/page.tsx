'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Star, Quote, User, Loader2 } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  rating: number;
  text: string;
  has_photo: boolean;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

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
          setTestimonials(data.testimonials || []);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Fallback testimonials if database is empty
  const defaultTestimonials = [
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

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Client Testimonials</h1>
            <p className="text-xl text-emerald-100">
              Hear what our clients say about their experience with MedConsult Liberia
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayTestimonials.map((testimonial, index) => (
                  <div key={testimonial.id || index} className="bg-white rounded-xl shadow-lg p-6 relative">
                    <Quote className="absolute top-4 right-4 text-emerald-200" size={48} />
                    
                    {/* Photo */}
                    <div className="flex items-center gap-4 mb-4">
                      {testimonial.has_photo && testimonial.id ? (
                        <img
                          src={`/api/testimonials/photo?id=${testimonial.id}&t=${Date.now()}`}
                          alt={testimonial.name}
                          className="w-16 h-16 rounded-full object-cover border-3 border-emerald-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                          <User className="w-8 h-8 text-emerald-600" />
                        </div>
                      )}
                      <div>
                        <div className="flex gap-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="text-emerald-500 fill-emerald-500" size={16} />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                    
                    <div className="border-t pt-4">
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
