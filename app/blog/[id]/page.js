export default function BlogPostPage({ params }) {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Blog Post {params.id}</h1>
        <p className="text-lg text-gray-600 mb-12">
          This is a placeholder for blog post content.
        </p>
        <a href="/blog" className="text-blue-600 hover:underline">
          ← Back to Blog
        </a>
      </div>
    </div>
  );
}
