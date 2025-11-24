/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Completely disable TypeScript checking
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  // Force clean build
  distDir: '.next',
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

module.exports = nextConfig;
