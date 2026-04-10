import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — only allow framing from same origin
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer information sent with requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Opt out of Google FLoC / Topics API tracking
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  // XSS protection (legacy browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Force HTTPS (Vercel handles this, but belt-and-suspenders)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Content Security Policy — restrictive but practical
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Cloudflare Turnstile + inline for Next.js hydration
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      // Styles: self + inline for Tailwind/KaTeX + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: self + Google Fonts CDN
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: self + data URIs (base64 concept images) + Supabase
      "img-src 'self' data: blob: https://*.supabase.co",
      // Connect: self + API server + Supabase + Cloudflare + AI providers
      "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://*.vercel.app https://*.onrender.com",
      // Frames: Turnstile widget
      "frame-src https://challenges.cloudflare.com",
      // Base URI restriction
      "base-uri 'self'",
      // Form submission targets
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "mathai.app" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },

  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },

  // Security headers applied to all routes
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
    // Cache static assets aggressively
    {
      source: "/static/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    // Cache fonts
    {
      source: "/(.*\\.woff2?)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
