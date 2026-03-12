import type { NextConfig } from "next";

/**
 * Next.js configuration with security headers and bundle optimization.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), unload=()",
          },
          /**
           * Content-Security-Policy
           *
           * frame-src MUST include instagram.com or reel embeds are blocked
           * by the browser before even reaching our iframe error handlers.
           */
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.instagram.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.cdninstagram.com https://www.instagram.com",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://precious-sawfly-68348.upstash.io",
              "frame-src https://www.instagram.com https://instagram.com",
              "child-src https://www.instagram.com https://instagram.com",
              "media-src 'self' https://*.cdninstagram.com",
            ].join("; "),
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.cdninstagram.com" },
      { protocol: "https", hostname: "www.instagram.com" },
    ],
  },

  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
};

export default nextConfig;
