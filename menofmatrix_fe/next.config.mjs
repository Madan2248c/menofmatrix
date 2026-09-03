import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

// Minimal KEY=VALUE parser so we don't depend on `dotenv` (which is only
// present transitively via the shadcn CLI and would break the build if that
// tree changes). Handles the simple `KEY=value` lines in backend/env.
function parseEnvFile(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || line.trimStart().startsWith("#")) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

// Local dev only: pull the Google OAuth credentials from the backend's env so
// NextAuth's token exchange works without duplicating the secret. On Vercel,
// backend/env doesn't exist and these come from the project settings.
const projectDir = path.dirname(fileURLToPath(import.meta.url));
const backendEnv = [path.join(projectDir, "../backend/.env"), path.join(projectDir, "../backend/env")]
  .find((candidate) => fs.existsSync(candidate));
if (process.env.NODE_ENV !== "production" && backendEnv) {
  const parsed = parseEnvFile(fs.readFileSync(backendEnv, "utf8"));
  for (const key of ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "JWT_SECRET"]) {
    if (parsed[key] && !process.env[key]) process.env[key] = parsed[key];
  }
  if (parsed.JWT_SECRET && !process.env.AUTH_SECRET) process.env.AUTH_SECRET = parsed.JWT_SECRET;
}

const BACKEND = process.env.BACKEND_URL || (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "https://backend-two-delta-twnhtuwv4g.vercel.app");

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
