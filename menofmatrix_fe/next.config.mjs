const BACKEND = process.env.BACKEND_URL || "https://backend-two-delta-twnhtuwv4g.vercel.app";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
