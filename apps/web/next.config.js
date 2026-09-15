/** @type {import('next').NextConfig} */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@realtyos/shared'],
  compiler: {
    // Drop console.* in production builds to trim bundle + noise.
    removeConsole: { exclude: ['error', 'warn'] },
  },
  images: {
    domains: ['localhost', 'realtyos-uploads.s3.amazonaws.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
