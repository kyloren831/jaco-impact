import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-136e0001b0a14e4ba095932fbe4856f5.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001", "localhost:3030", "192.168.0.7:3030", "192.168.0.11:3000", "192.168.0.11:3001"],
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
