/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Add configuration to serve static files from the shared directory
  async rewrites() {
    return [
      {
        source: '/shared/:path*',
        destination: '/shared/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 