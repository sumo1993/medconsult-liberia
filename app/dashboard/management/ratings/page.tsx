'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Calendar, FileText, User } from 'lucide-react';
import { RatingStars } from '@/components/RatingStars';

interface Rating {
  id: number;
  rating: number;
  review: string | null;
  created_at: string;
  client_name: string;
  assignment_title: string;
  assignment_request_id: number;
}

export default function DoctorRatingsPage() {
  const router = useRouter();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStars: 0,
  });

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      
      // Get user ID from profile
      const profileRes = await fetch('/api/profile', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (!profileRes.ok) {
        console.error('Profile fetch failed:', profileRes.status);
        router.push('/login');
        return;
      }

      const profileData = await profileRes.json();
      const doctorId = profileData.id;
      console.log('Fetching ratings for doctor ID:', doctorId);

      // Fetch ratings
      const response = await fetch(`/api/ratings?doctorId=${doctorId}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Ratings data received:', data);
        const ratingsArray = data.ratings || [];
        setRatings(ratingsArray);
        
        // Calculate stats
        const total = ratingsArray.length;
        const sum = ratingsArray.reduce((acc: number, r: Rating) => acc + r.rating, 0);
        const avg = total > 0 ? sum / total : 0;
        
        console.log('Stats calculated:', { total, avg });
        
        setStats({
          averageRating: avg,
          totalRatings: total,
          fiveStars: ratingsArray.filter((r: Rating) => r.rating === 5).length,
          fourStars: ratingsArray.filter((r: Rating) => r.rating === 4).length,
          threeStars: ratingsArray.filter((r: Rating) => r.rating === 3).length,
          twoStars: ratingsArray.filter((r: Rating) => r.rating === 2).length,
          oneStars: ratingsArray.filter((r: Rating) => r.rating === 1).length,
        });
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch ratings:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRatingPercentage = (count: number) => {
    return stats.totalRatings > 0 ? ((count / stats.totalRatings) * 100).toFixed(0) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Ratings & Reviews</h1>
              <p className="text-sm text-gray-600">See what clients are saying about you</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading ratings...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Overall Rating Card */}
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Star className="fill-white" size={20} />
                  <span>Overall Rating</span>
                </h2>
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                  </div>
                  <div className="flex justify-center mb-2">
                    <RatingStars rating={stats.averageRating} readonly size={24} />
                  </div>
                  <p className="text-yellow-100">
                    Based on {stats.totalRatings} {stats.totalRatings === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                <div className="space-y-3">
                  {[
                    { stars: 5, count: stats.fiveStars },
                    { stars: 4, count: stats.fourStars },
                    { stars: 3, count: stats.threeStars },
                    { stars: 2, count: stats.twoStars },
                    { stars: 1, count: stats.oneStars },
                  ].map(({ stars, count }) => (
                    <div key={stars} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 w-20">
                        <span className="text-sm font-medium">{stars}</span>
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${getRatingPercentage(count)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Reviews */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Client Reviews ({stats.totalRatings})
              </h2>

              {ratings.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <Star size={48} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Reviews Yet
                  </h3>
                  <p className="text-gray-600">
                    Complete assignments to receive ratings from clients.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div
                      key={rating.id}
                      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                    >
                      {/* Rating Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="bg-emerald-100 rounded-full p-2">
                              <User size={20} className="text-emerald-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {rating.client_name}
                              </h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Calendar size={14} />
                                <span>{formatDate(rating.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <RatingStars rating={rating.rating} readonly size={18} />
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/management/assignment-requests/${rating.assignment_request_id}`)}
                          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-1"
                        >
                          <FileText size={16} />
                          <span>View Assignment</span>
                        </button>
                      </div>

                      {/* Assignment Title */}
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <p className="text-sm text-gray-600">
                          <strong>Assignment:</strong> {rating.assignment_title}
                        </p>
                      </div>

                      {/* Review Text */}
                      {rating.review && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700 leading-relaxed">
                            "{rating.review}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
