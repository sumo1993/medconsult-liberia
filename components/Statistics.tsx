'use client';

import { useState, useEffect } from 'react';
import { Award, Building2, Star, Users, Calendar } from 'lucide-react';

interface Stats {
  research_projects: number;
  clinic_setups: number;
  rating: number;
  total_consultations: number;
  years_experience: number;
}

export default function Statistics() {
  const [stats, setStats] = useState<Stats>({
    research_projects: 0,
    clinic_setups: 0,
    rating: 5.0,
    total_consultations: 0,
    years_experience: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/statistics');
      if (response.ok) {
        const data = await response.json();
        // Ensure rating is a number
        setStats({
          ...data,
          rating: parseFloat(data.rating) || 5.0
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-emerald-700 to-emerald-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our Track Record
          </h2>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
            Decades of excellence in medical consultation and healthcare development
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {/* Years of Experience */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-all transform hover:scale-105">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Calendar className="text-white" size={32} />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">{stats.years_experience}+</div>
            <div className="text-emerald-100 font-medium">Years Experience</div>
          </div>

          {/* Research Projects */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-all transform hover:scale-105">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Award className="text-white" size={32} />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">{stats.research_projects}+</div>
            <div className="text-emerald-100 font-medium">Research Projects</div>
          </div>

          {/* Clinic Setups */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-all transform hover:scale-105">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Building2 className="text-white" size={32} />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">{stats.clinic_setups}+</div>
            <div className="text-emerald-100 font-medium">Clinic Setups</div>
          </div>

          {/* Total Consultations */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-all transform hover:scale-105">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Users className="text-white" size={32} />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">{stats.total_consultations}+</div>
            <div className="text-emerald-100 font-medium">Consultations</div>
          </div>

          {/* Rating */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-all transform hover:scale-105">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Star className="text-white" size={32} />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">{stats.rating.toFixed(2)}</div>
            <div className="text-emerald-100 font-medium flex items-center justify-center">
              <Star className="text-yellow-300 fill-yellow-300 mr-1" size={16} />
              Rating
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
