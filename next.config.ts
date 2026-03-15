import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

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
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            // Vercel Analytics + Speed Insights need va.vercel-scripts.com
                            "script-src 'self' 'unsafe-inline' https://www.instagram.com https://va.vercel-scripts.com",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: blob: https://*.cdninstagram.com https://www.instagram.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            // Vercel Analytics beacon + Supabase + Upstash
                            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://precious-sawfly-68348.upstash.io https://va.vercel-scripts.com https://vitals.vercel-insights.com",
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
        optimizePackageImports: ["framer-motion", "@dicebear/core", "@dicebear/bottts"],
    },
};

export default withSentryConfig(
    withNextIntl(nextConfig),
    {
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        silent: !process.env.CI,

        // Pass the auth token
        authToken: process.env.SENTRY_AUTH_TOKEN,
        // Upload a larger set of source maps for prettier stack traces
        widenClientFileUpload: true,
    }
);
