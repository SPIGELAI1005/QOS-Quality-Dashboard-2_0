import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Increased for large Excel files
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    }
    return config;
  },
  // Serve static files from public directory
  async headers() {
    return [
      {
        source: '/Media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default config;

