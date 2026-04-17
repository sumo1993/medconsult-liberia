'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Image as ImageIcon, Video, Play, X, ChevronLeft, ChevronRight,
  Loader2, Search, Filter,
} from 'lucide-react';

interface MediaPost {
  id: number;
  title: string;
  description: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url: string | null;
  author_name: string;
  created_at: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxItem, setLightboxItem] = useState<MediaPost | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/media?page=${page}&limit=24&public=true`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const filteredMedia = media.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || m.media_type === filterType;
    return matchesSearch && matchesType;
  });

  const openLightbox = (item: MediaPost) => {
    const idx = filteredMedia.findIndex((m) => m.id === item.id);
    setLightboxIndex(idx);
    setLightboxItem(item);
  };

  const navigateLightbox = (dir: 1 | -1) => {
    const next = lightboxIndex + dir;
    if (next >= 0 && next < filteredMedia.length) {
      setLightboxIndex(next);
      setLightboxItem(filteredMedia[next]);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!lightboxItem) return;
      if (e.key === 'Escape') setLightboxItem(null);
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Media Gallery</h1>
            <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto">
              Photos and videos from MedConsult Liberia — our events, team, and community impact.
            </p>
          </div>
        </section>

        {/* Filter & Search */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400 hidden sm:block" />
              {(['all', 'image', 'video'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    filterType === type
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white text-gray-600 border hover:bg-gray-50'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'image' ? 'Photos' : 'Videos'}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-emerald-500" size={40} />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-20">
              <ImageIcon size={56} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-xl font-medium">No media yet</p>
              <p className="text-gray-400 text-sm mt-2">Check back soon for photos and videos.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => openLightbox(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openLightbox(item)}
                  >
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      {item.media_type === 'video' ? (
                        <>
                          {item.thumbnail_url ? (
                            <img
                              src={item.thumbnail_url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                              <Video size={48} className="text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/50 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform">
                              <Play size={28} className="text-white ml-0.5" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <img
                          src={item.media_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                    </div>
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <h3 className="text-white font-semibold text-sm truncate">{item.title}</h3>
                      {item.description && (
                        <p className="text-white/80 text-xs mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <span className="text-white/60 text-xs mt-2">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {/* Type badge */}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      {item.media_type === 'video' ? <Video size={11} /> : <ImageIcon size={11} />}
                      {item.media_type === 'video' ? 'Video' : 'Photo'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-3 text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white border rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Lightbox */}
      {lightboxItem && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxItem(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-10"
            onClick={() => setLightboxItem(null)}
          >
            <X size={28} />
          </button>

          {/* Nav arrows */}
          {lightboxIndex > 0 && (
            <button
              className="absolute left-2 sm:left-6 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-10"
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox(-1);
              }}
            >
              <ChevronLeft size={32} />
            </button>
          )}
          {lightboxIndex < filteredMedia.length - 1 && (
            <button
              className="absolute right-2 sm:right-6 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-10"
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox(1);
              }}
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Content */}
          <div
            className="max-w-5xl w-full mx-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxItem.media_type === 'video' ? (
              <video
                key={lightboxItem.id}
                src={lightboxItem.media_url}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full rounded-lg shadow-2xl"
              />
            ) : (
              <img
                key={lightboxItem.id}
                src={lightboxItem.media_url}
                alt={lightboxItem.title}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            )}
            <div className="text-center mt-4">
              <h2 className="text-white text-lg font-semibold">{lightboxItem.title}</h2>
              {lightboxItem.description && (
                <p className="text-white/70 text-sm mt-1 max-w-2xl">{lightboxItem.description}</p>
              )}
              <span className="text-white/50 text-xs mt-2 inline-block">
                {new Date(lightboxItem.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
