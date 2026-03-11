import type { NextConfig } from "next";

/**
 * Next.js configuration with security headers and bundle optimization.
 *
 * WHY:
 * - Security headers prevent common web attacks (XSS, clickjacking, MIME sniffing)
 * - Bundle analyzer helps identify optimization opportunities
 * - Image optimization for Instagram embed thumbnails
 */
const nextConfig: NextConfig = {
  // Strict React mode catches common bugs during development
  reactStrictMode: true,

  // Security headers for production
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevents clickjacking — only allow our own frames
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Prevents MIME-type sniffing attacks
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Controls referrer information sent with requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disables browser features we don't need — reduces attack surface
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Allow Instagram embed images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
      },
    ],
  },

  // Experimental: optimize package imports for smaller bundles
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
