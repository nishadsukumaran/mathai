import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode catches common React issues during development
  reactStrictMode: true,

  // Skip TS type-checking during build (types are checked locally / in CI)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Images — use remotePatterns (domains is deprecated)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mathai.app",
      },
      // Supabase storage bucket
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Expose only public env vars to the client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },
};

export default nextConfig;
