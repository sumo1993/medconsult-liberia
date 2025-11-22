import Head from 'next/head';

interface SEOHeadProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  author?: string;
  tags?: string[];
}

export default function SEOHead({
  title,
  description = 'MedConsult Liberia - Professional Medical Consultation and Research',
  image = '/og-image.jpg',
  url,
  type = 'website',
  publishedTime,
  author,
  tags = [],
}: SEOHeadProps) {
  const siteTitle = `${title} | MedConsult Liberia`;
  const siteUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={`medical, healthcare, liberia, research, ${tags.join(', ')}`} />
      <meta name="author" content={author || 'MedConsult Liberia'} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="MedConsult Liberia" />

      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          {author && <meta property="article:author" content={author} />}
          {tags.map((tag, i) => (
            <meta key={i} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={siteUrl} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <link rel="canonical" href={siteUrl} />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
    </Head>
  );
}
