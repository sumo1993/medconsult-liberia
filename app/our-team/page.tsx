'use client';

import { useEffect, useState } from 'react';
import { Star, Award, BookOpen, Mail, Briefcase, Eye, Heart, FileText, Download } from 'lucide-react';

interface ResearchPaper {
  id: number;
  title: string;
  summary: string;
  category: string;
  views: number;
  likes: number;
  published_at: string;
}

interface Researcher {
  id: number;
  full_name: string;
  email: string;
  specialization: string;
  years_of_experience: number;
  bio: string;
  average_rating: number;
  total_ratings: number;
  profile_photo_filename: string | null;
  research_count?: number;
  total_views?: number;
  total_likes?: number;
}

export default function OurTeamPage() {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);

  useEffect(() => {
    fetchResearchers();
  }, []);

  const fetchResearchers = async () => {
    try {
      const response = await fetch('/api/researchers');
      if (response.ok) {
        const data = await response.json();
        setResearchers(data);
      }
    } catch (error) {
      console.error('Error fetching researchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResearchPapers = async (researcherId: number) => {
    setLoadingPapers(true);
    try {
      const response = await fetch(`/api/researchers/${researcherId}/papers`);
      if (response.ok) {
        const data = await response.json();
        setResearchPapers(data);
      }
    } catch (error) {
      console.error('Error fetching research papers:', error);
    } finally {
      setLoadingPapers(false);
    }
  };

  const handleReadMore = (researcher: Researcher) => {
    setSelectedResearcher(researcher);
    setShowModal(true);
    fetchResearchPapers(researcher.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading our team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Research Team</h1>
          <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
            Meet our dedicated team of researchers and consultants committed to advancing healthcare knowledge in Liberia
          </p>
        </div>
      </div>

      {/* Team Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">{researchers.length}</div>
            <div className="text-gray-600">Expert Researchers</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">
              {researchers.reduce((sum, r) => sum + (r.years_of_experience || 0), 0)}+
            </div>
            <div className="text-gray-600">Years Combined Experience</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">
              {researchers.filter(r => r.average_rating && Number(r.average_rating) >= 4.5).length}
            </div>
            <div className="text-gray-600">Highly Rated Experts</div>
          </div>
        </div>
      </div>

      {/* Researchers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {researchers.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Researchers Yet</h3>
            <p className="text-gray-600">Our team is growing. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {researchers.map((researcher) => (
              <div
                key={researcher.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Profile Photo */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 h-48 flex items-center justify-center relative">
                  {researcher.profile_photo_filename ? (
                    <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-lg">
                      <img
                        src={`/api/profile-photo/${researcher.id}?t=${Date.now()}`}
                        alt={researcher.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-lg">
                      <span className="text-5xl font-bold text-emerald-600">
                        {researcher.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{researcher.full_name}</h3>
                  
                  {researcher.specialization && (
                    <div className="flex items-center gap-2 text-emerald-600 mb-3">
                      <Award size={16} />
                      <span className="text-sm font-semibold">{researcher.specialization}</span>
                    </div>
                  )}

                  {researcher.years_of_experience && (
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <Briefcase size={16} />
                      <span className="text-sm">{researcher.years_of_experience} years experience</span>
                    </div>
                  )}

                  {/* Rating */}
                  {researcher.total_ratings > 0 && researcher.average_rating && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i < Math.floor(Number(researcher.average_rating))
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {Number(researcher.average_rating).toFixed(1)} ({researcher.total_ratings} reviews)
                      </span>
                    </div>
                  )}

                  {/* Bio */}
                  {researcher.bio && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {researcher.bio}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t flex gap-3">
                    <button
                      onClick={() => handleReadMore(researcher)}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold"
                    >
                      Read More
                    </button>
                    <a
                      href={`mailto:${researcher.email}`}
                      className="flex-1 px-4 py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-semibold text-center flex items-center justify-center gap-2"
                    >
                      <Mail size={16} />
                      Contact
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Researcher Detail Modal */}
      {showModal && selectedResearcher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8 relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex items-center gap-6">
                {selectedResearcher.profile_photo_filename ? (
                  <img
                    src={`/api/profile-photo/${selectedResearcher.id}?t=${Date.now()}`}
                    alt={selectedResearcher.full_name}
                    className="w-24 h-24 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-white flex items-center justify-center">
                    <span className="text-4xl font-bold text-emerald-600">
                      {selectedResearcher.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedResearcher.full_name}</h2>
                  {selectedResearcher.specialization && (
                    <div className="flex items-center gap-2 text-emerald-100">
                      <Award size={18} />
                      <span className="text-lg">{selectedResearcher.specialization}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
              <div className="bg-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl font-bold text-emerald-600">{selectedResearcher.research_count || 0}</div>
                <div className="text-sm text-gray-600">Research Papers</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl font-bold text-blue-600">{selectedResearcher.total_views || 0}</div>
                <div className="text-sm text-gray-600">Total Views</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl font-bold text-pink-600">{selectedResearcher.total_likes || 0}</div>
                <div className="text-sm text-gray-600">Likes</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl font-bold text-yellow-600">
                  {selectedResearcher.average_rating ? Number(selectedResearcher.average_rating).toFixed(1) : '0.0'}
                </div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Experience */}
              {selectedResearcher.years_of_experience && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Briefcase size={20} className="text-emerald-600" />
                    Experience
                  </h3>
                  <p className="text-gray-700">{selectedResearcher.years_of_experience} years of professional experience in healthcare research</p>
                </div>
              )}

              {/* Bio */}
              {selectedResearcher.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedResearcher.bio}</p>
                </div>
              )}

              {/* Rating */}
              {selectedResearcher.total_ratings > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Feedback</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          className={
                            i < Math.floor(Number(selectedResearcher.average_rating))
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                    <span className="text-gray-600">
                      {Number(selectedResearcher.average_rating).toFixed(1)} out of 5 ({selectedResearcher.total_ratings} reviews)
                    </span>
                  </div>
                </div>
              )}

              {/* Research Papers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={20} className="text-emerald-600" />
                  Published Research ({selectedResearcher.research_count || 0})
                </h3>
                
                {loadingPapers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading research papers...</p>
                  </div>
                ) : researchPapers.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <BookOpen className="mx-auto text-gray-400 mb-2" size={40} />
                    <p className="text-gray-600">No published research yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {researchPapers.map((paper) => (
                      <div key={paper.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-gray-900 mb-2">{paper.title}</h4>
                        {paper.summary && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{paper.summary}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye size={16} />
                              {paper.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart size={16} className="text-pink-500" />
                              {paper.likes}
                            </span>
                            {paper.category && (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">
                                {paper.category}
                              </span>
                            )}
                          </div>
                          <a
                            href={`/research/${paper.id}`}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm flex items-center gap-1"
                          >
                            View Paper
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="pt-4 border-t">
                <a
                  href={`mailto:${selectedResearcher.email}`}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Mail size={20} />
                  Contact {selectedResearcher.full_name.split(' ')[0]}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
