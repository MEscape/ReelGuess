import * as Sentry from "@sentry/nextjs";

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await import("../sentry.server.config");
    }
    if (process.env.NEXT_RUNTIME === "edge") {
        await import("../sentry.edge.config");
    }
}

/**
 * `onRequestError` is the Next.js instrumentation hook that fires for every
 * unhandled error in Server Components, Route Handlers, and Middleware.
 *
 * `Sentry.captureRequestError` is the official Sentry handler for this hook.
 * It automatically attaches request metadata (URL, method, headers) to the
 * Sentry event — giving you far richer context than a plain `captureException`.
 *
 * ✅ Keep this export exactly as-is.
 * ✅ It complements `withSentry()` in actions (which handles Server Action errors).
 * ✅ Together they cover 100% of server-side error paths:
 *    - Server Components    → onRequestError
 *    - Route Handlers       → onRequestError
 *    - Middleware           → onRequestError
 *    - Server Actions       → withSentry / withServerActionInstrumentation
 *
 * Do NOT remove or rename this export — Next.js requires exactly this name.
 */
export const onRequestError = Sentry.captureRequestError;