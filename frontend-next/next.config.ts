import type { NextConfig } from "next";

const backendURL =
  process.env.BACKEND_URL ||
  "https://documind-backend-88vf.onrender.com";

const nextConfig: NextConfig = {
  devIndicators: false,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendURL}/:path*`,
      },
    ];
  },
};

export default nextConfig;