import Link from 'next/link';
import { headers } from 'next/headers';

async function getResource(id) {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
    const protocol = h.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;
    const response = await fetch(`${baseUrl}/api/health-resources/${id}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export default async function BlogPostPage({ params }) {
  const resource = await getResource(params.id);

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Resource not found</h1>
          <Link href="/health-resources" className="text-emerald-700 hover:underline">
            ← Back to Health Resources
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">{resource.title}</h1>
        <div className="mb-6 flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{resource.category}</span>
          {resource.file_size ? <span className="text-sm text-gray-500">{resource.file_size}</span> : null}
        </div>
        <p className="text-lg text-gray-600 mb-8">{resource.description}</p>
        {resource.url ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-emerald-700 hover:underline mb-8"
          >
            Open External Resource
          </a>
        ) : null}
        <Link href="/health-resources" className="text-blue-600 hover:underline">
          ← Back to Health Resources
        </Link>
      </div>
    </div>
  );
}
