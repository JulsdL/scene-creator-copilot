import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8123',
        pathname: '/generated/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8123',
        pathname: '/generated/**',
      },
    ],
  },
};

export default nextConfig;
