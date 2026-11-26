import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://documind-backend-88vf.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;