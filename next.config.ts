import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001", "localhost:3030", "192.168.0.7:3030", "192.168.0.11:3000", "192.168.0.11:3001"],
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
