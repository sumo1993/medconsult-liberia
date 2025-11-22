import { Metadata } from 'next';

interface GenerateMetadataProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  tags?: string[];
}

export function generateSEOMetadata({
  title,
  description = 'MedConsult Liberia - Professional Medical Consultation and Research',
  image = '/og-image.jpg',
  type = 'website',
  publishedTime,
  tags = [],
}: GenerateMetadataProps): Metadata {
  const siteTitle = `${title} | MedConsult Liberia`;

  return {
    title: siteTitle,
    description,
    keywords: ['medical', 'healthcare', 'liberia', 'research', 'consultation', ...tags],
    authors: [{ name: 'MedConsult Liberia' }],
    openGraph: {
      title: siteTitle,
      description,
      type: type,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: 'MedConsult Liberia',
      ...(publishedTime && type === 'article' && {
        publishedTime,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// Schema.org JSON-LD for articles
export function generateArticleSchema(post: {
  title: string;
  content: string;
  summary?: string;
  publishedAt: string;
  author?: string;
  image?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.summary || post.content.substring(0, 160),
    image: post.image || '/og-image.jpg',
    datePublished: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.author || 'MedConsult Liberia',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MedConsult Liberia',
      logo: {
        '@type': 'ImageObject',
        url: '/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.url,
    },
  };
}
