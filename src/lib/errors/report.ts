import * as Sentry from '@sentry/nextjs'

// ─────────────────────────────────────────────────────────────────────────────
// Centralized Error Reporting
//
// All errors (server actions, hooks, realtime) flow through here.
// This decouples Sentry from feature code — swap provider without touching call sites.
// ─────────────────────────────────────────────────────────────────────────────

export type ErrorContext = {
    /** User-facing feature context, e.g. "lobby.join" */
    feature?:   string
    /** Additional metadata to attach to the event */
    extra?:     Record<string, unknown>
    /** Error severity level */
    level?:     'error' | 'warning' | 'info'
}

/**
 * Report an error to Sentry.
 *
 * Usage:
 *   reportError(new Error('Something failed'), { feature: 'lobby.create' })
 *   reportError('Custom message', { feature: 'voting', level: 'warning' })
 */
export function reportError(
    error:   Error | string | unknown,
    context: ErrorContext = {},
): void {
    const { feature, extra, level = 'error' } = context

    if (process.env.NODE_ENV === 'development') {
        console.error(`[${feature ?? 'app'}]`, error, extra)
    }

    Sentry.withScope((scope) => {
        scope.setLevel(level)

        if (feature) scope.setTag('feature', feature)
        if (extra)   scope.setExtras(extra)

        if (error instanceof Error) {
            Sentry.captureException(error)
        } else if (typeof error === 'string') {
            Sentry.captureMessage(error)
        } else {
            Sentry.captureException(new Error(String(error)))
        }
    })
}

/**
 * Report a non-critical warning.
 * Useful for recoverable errors that degrade UX but don't break functionality.
 */
export function reportWarning(message: string, extra?: Record<string, unknown>): void {
    reportError(message, { level: 'warning', extra })
}

/**
 * Set the active user context in Sentry.
 * Call after a player joins a lobby — uses anonymous ID only (no PII).
 */
export function setSentryUser(playerId: string): void {
    Sentry.setUser({ id: playerId })
}

/**
 * Clear the user context (on leave / game over).
 */
export function clearSentryUser(): void {
    Sentry.setUser(null)
}
