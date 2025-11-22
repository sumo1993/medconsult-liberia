'use client';

import { useState, useEffect } from 'react';

interface HeroImage {
  id: number;
  url: string;
  order: number;
  is_active?: boolean;
}

export default function Hero() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    fetchHeroImages();
  }, []);

  useEffect(() => {
    // Auto-rotate images every 5 seconds
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % heroImages.length);
          setIsTransitioning(false);
        }, 500);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  const fetchHeroImages = async () => {
    try {
      const response = await fetch('/api/admin/hero-images');
      if (response.ok) {
        const data = await response.json();
        if (data.images && data.images.length > 0) {
          setHeroImages(data.images);
        } else {
          // Fallback to default image
          setHeroImages([{
            id: 0,
            url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
            order: 1
          }]);
        }
      }
    } catch (error) {
      console.error('Error fetching hero images:', error);
      // Use default image on error
      setHeroImages([{
        id: 0,
        url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        order: 1
      }]);
    }
  };

  const currentImage = heroImages[currentIndex]?.url || "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80";

  return (
    <section
      id="home"
      className="relative w-full h-[600px] md:h-[700px] lg:h-[900px] flex items-center justify-center text-center overflow-hidden"
    >
      {/* Background Image with Fade Transition */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage: `url('${currentImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: isTransitioning ? 0 : 1,
        }}
      />
      {/* White overlay for better text readability */}
      <div className="absolute inset-0 bg-white/90"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-5xl">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-emerald-700 mb-8 leading-tight">
          Expert Medical Consultation in Monrovia
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
          Decades of experience in <span className="text-emerald-600 font-semibold">clinical practice</span>, <span className="text-emerald-600 font-semibold">medical research</span>, and <span className="text-emerald-600 font-semibold">public health initiatives</span> with NGOs and government projects across Liberia.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="#contact"
            className="inline-block px-8 py-3 bg-emerald-700 text-white font-semibold rounded-md hover:bg-emerald-800 transition-all hover:-translate-y-1"
          >
            Book an Appointment
          </a>
          <a
            href="#about"
            className="inline-block px-8 py-3 bg-transparent border-2 border-emerald-700 text-emerald-700 font-semibold rounded-md hover:bg-emerald-700 hover:text-white transition-all"
          >
            Learn More
          </a>
          <a
            href="#partnerships"
            className="inline-block px-8 py-3 bg-yellow-600 text-gray-900 font-semibold rounded-md hover:bg-yellow-700 transition-all"
          >
            Partner With Us
          </a>
        </div>
      </div>
    </section>
  );
}
