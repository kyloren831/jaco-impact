import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["192.168.0.7:3030", "localhost:3030"],
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
