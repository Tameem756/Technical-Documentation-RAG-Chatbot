import type { NextConfig } from "next";

const backendURL =
  process.env.BACKEND_URL || "http://127.0.0.1:8000";

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