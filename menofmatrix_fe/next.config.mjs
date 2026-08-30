import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { parse as parseEnv } from "dotenv";

// Local dev only: pull the Google OAuth credentials from the backend's .env so
// NextAuth's token exchange works without duplicating the secret. On Vercel,
// backend/.env doesn't exist and these come from the project settings.
const backendEnv = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../backend/.env"
);
if (process.env.NODE_ENV !== "production" && fs.existsSync(backendEnv)) {
  const parsed = parseEnv(fs.readFileSync(backendEnv));
  for (const key of ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]) {
    if (parsed[key] && !process.env[key]) process.env[key] = parsed[key];
  }
}

const BACKEND = process.env.BACKEND_URL || "https://backend-two-delta-twnhtuwv4g.vercel.app";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Keep NextAuth locally — do not proxy to backend
      {
        source: "/api/auth/:path*",
        destination: "/api/auth/:path*",
      },
      {
        source: "/api/:path*",
        destination: `${BACKEND}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
