/* global process */
/** @type {import('next').NextConfig} */
const nextConfig = {
  // The e2e suite builds into its own folder (see playwright.config.ts), so running it never
  // overwrites what a `next dev` server has compiled in .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The original site's images are plain static files (not run through
  // next/image optimization) — keep that behaviour so nothing breaks
  // if you later switch some <img> tags to next/image.
  images: {
    unoptimized: true,
  },
  // Linting runs as its own step (eslint.config.mjs; Next 14's built-in lint
  // can't read ESLint 9 flat config).
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Photos uploaded through the admin live with the API (MediaStorage:RootPath) and are
  // stored as /media/... paths. Serve them from this origin so the site and admin can use
  // them like the static /images/... files. API_URL is read when the app is built.
  // The Giraffe Manor page is now the packages list filtered to Giraffe Manor.
  async redirects() {
    return [{ source: "/giraffe-manor", destination: "/packages?partner=giraffe-manor", permanent: true }];
  },
  async rewrites() {
    const api = (process.env.API_URL ?? "http://localhost:5270").replace(/\/+$/, "");
    return [{ source: "/media/:path*", destination: `${api}/media/:path*` }];
  },
};

export default nextConfig;
