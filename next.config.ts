import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        // Amber inventory images.
        hostname: "assets.amberstudent.com",
      },
      {
        protocol: "https",
        // Older/sample Amber payloads serve images straight from S3.
        hostname: "**.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
