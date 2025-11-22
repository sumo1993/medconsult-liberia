/** @type {import('next').NextConfig} */
const nextConfig = {
  // For App Router (Next.js 13+)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

module.exports = nextConfig;
