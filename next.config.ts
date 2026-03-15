import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
                            // default
                            "default-src 'self'",

                            // Scripts
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.instagram.com https://va.vercel-scripts.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://*.google.com",

                            // Styles
                            "style-src 'self' 'unsafe-inline'",

                            // Images
                            "img-src 'self' data: blob: https://*.cdninstagram.com https://www.instagram.com https://*.googlesyndication.com https://*.doubleclick.net https://*.googleusercontent.com https://*.adtrafficquality.google https://*.google.com",

                            // Fonts
                            "font-src 'self' https://fonts.gstatic.com",

                            // API / WebSocket connections
                            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://precious-sawfly-68348.upstash.io https://va.vercel-scripts.com https://vitals.vercel-insights.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://*.google.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io",

                            // Frames (ads + Instagram)
                            "frame-src https://www.instagram.com https://instagram.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.googlesyndication.com https://*.adtrafficquality.google https://*.doubleclick.net https://*.google.com",

                            // Child frames
                            "child-src https://www.instagram.com https://instagram.com https://*.googlesyndication.com https://*.adtrafficquality.google https://*.doubleclick.net https://*.google.com",

                            // Media
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
            { protocol: "https", hostname: "*.googleusercontent.com" },
            { protocol: "https", hostname: "*.googlesyndication.com" },
            { protocol: "https", hostname: "*.doubleclick.net" },
            { protocol: "https", hostname: "*.adtrafficquality.google" },
        ],
    },

    experimental: {
        optimizePackageImports: [
            "framer-motion",
            "@dicebear/core",
            "@dicebear/bottts",
        ],
    },
};

export default withSentryConfig(withNextIntl(nextConfig), {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.CI,

    authToken: process.env.SENTRY_AUTH_TOKEN,
    widenClientFileUpload: true,
});