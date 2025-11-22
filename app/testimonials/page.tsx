'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Star, Quote } from 'lucide-react';

export default function TestimonialsPage() {
  const testimonials = [
    {
      name: 'John Doe',
      role: 'Client',
      rating: 5,
      text: 'Excellent service! The consultant was professional and provided clear guidance for my medical concerns.',
      date: '2024-01-15'
    },
    {
      name: 'Jane Smith',
      role: 'Research Client',
      rating: 5,
      text: 'Outstanding research support. Helped me complete my medical thesis with expert insights.',
      date: '2024-02-20'
    },
    {
      name: 'Michael Johnson',
      role: 'Corporate Client',
      rating: 5,
      text: 'Professional and reliable. MedConsult Liberia has been instrumental in our healthcare initiatives.',
      date: '2024-03-10'
    },
  ];

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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 relative">
                  <Quote className="absolute top-4 right-4 text-emerald-200" size={48} />
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="text-emerald-500 fill-emerald-500" size={20} />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                  <div className="border-t pt-4">
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
