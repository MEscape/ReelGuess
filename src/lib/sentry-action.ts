import * as Sentry from '@sentry/nextjs'

// ─────────────────────────────────────────────────────────────────────────────
// Sentry Server Action Wrapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps a Server Action function with Sentry tracing + error capture.
 *
 * Usage:
 * ```ts
 * export const myAction = withSentry('myAction', async (input) => {
 *   // action body
 * })
 * ```
 *
 * Why this helper instead of inline `withServerActionInstrumentation`:
 *  - Single import site — DRY across all actions.
 *  - Consistent `recordResponse: true` so server errors are tracked.
 *  - The generic `<T>` signature preserves full type inference.
 */
export function withSentry<TArgs extends unknown[], TReturn>(
    name: string,
    fn:   (...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<TReturn> {
    return (...args: TArgs): Promise<TReturn> =>
        Sentry.withServerActionInstrumentation(
            name,
            { recordResponse: true },
            () => fn(...args),
        ) as Promise<TReturn>
}
