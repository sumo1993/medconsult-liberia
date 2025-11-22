'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react';

export default function BlogPage() {
  const router = useRouter();

  const posts = [
    {
      id: 1,
      title: '10 Essential Health Tips for Liberians',
      excerpt: 'Discover practical health tips to maintain wellness in Liberia\'s climate and environment.',
      category: 'Health Tips',
      author: 'MedConsult Team',
      date: '2024-11-15',
      image: '/blog/health-tips.jpg'
    },
    {
      id: 2,
      title: 'Understanding Malaria Prevention',
      excerpt: 'Learn about effective malaria prevention strategies and treatment options available in Liberia.',
      category: 'Medical Insights',
      author: 'Dr. Isaac Zeah',
      date: '2024-11-10',
      image: '/blog/malaria.jpg'
    },
    {
      id: 3,
      title: 'MedConsult Liberia Expands Services',
      excerpt: 'We\'re excited to announce new consultation services and partnerships across Monrovia.',
      category: 'Company News',
      author: 'MedConsult Team',
      date: '2024-11-05',
      image: '/blog/expansion.jpg'
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen size={48} />
              <h1 className="text-4xl md:text-5xl font-bold">Blog & News</h1>
            </div>
            <p className="text-xl text-emerald-100">
              Stay informed with health tips, medical insights, and company updates
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
                    <BookOpen className="text-white" size={64} />
                  </div>
                  <div className="p-6">
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold mb-3">
                      {post.category}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h2>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <User size={16} />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {new Date(post.date).toLocaleDateString()}
                      </span>
                    </div>
                    <button className="text-emerald-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                      Read More <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
