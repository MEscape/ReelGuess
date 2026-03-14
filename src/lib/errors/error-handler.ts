import type { Result } from 'neverthrow'
import { ZodError }    from 'zod'

/**
 * A plain-object Result suitable for crossing the Server Action boundary.
 *
 * Server Actions cannot return class instances (e.g. `Result` from neverthrow),
 * so we serialize to `{ ok: true, value }` or `{ ok: false, error }`.
 */
export type SerializedResult<T, E = unknown> =
    | { ok: true;  value: T }
    | { ok: false; error: E }

/**
 * Converts a NeverThrow `Result<T, E>` to a {@link SerializedResult}.
 *
 * @example
 * ```ts
 * const result = await doSomething()
 * return serializeResult(result)
 * ```
 */
export function serializeResult<T, E>(result: Result<T, E>): SerializedResult<T, E> {
    return result.match(
        (value) => ({ ok: true  as const, value }),
        (error) => ({ ok: false as const, error }),
    )
}

/**
 * Converts any thrown value into a typed app error, with a safe user-facing message.
 *
 * - `ZodError` → generic "Something went wrong" so raw schema details (field
 *   paths, regex patterns) are never shown to the user. The full Zod issues
 *   are logged to the console for debugging.
 * - Structured app errors (objects with a `type` field) are returned as-is —
 *   they are already user-safe.
 * - Plain `Error` instances use the message string directly.
 *
 * @param e                 The caught value.
 * @param databaseErrorType The `type` discriminant for the DB-error variant.
 * @param fallback          Generic user-safe message for unexpected errors.
 */
export function toAppError<TError>(
    e: unknown,
    databaseErrorType: string,
    fallback = 'Something went wrong. Please try again.',
): TError {
    // Structured app error — already safe, pass through.
    if (e !== null && typeof e === 'object' && 'type' in e) {
        return e as TError
    }

    // ZodError — log internally, never surface raw details to the user.
    if (e instanceof ZodError) {
        console.error('[ZodError]', e.issues)
        return { type: databaseErrorType, message: fallback } as unknown as TError
    }

    // Generic Error — use the message.
    if (e instanceof Error) {
        return { type: databaseErrorType, message: e.message } as unknown as TError
    }

    return { type: databaseErrorType, message: fallback } as unknown as TError
}

