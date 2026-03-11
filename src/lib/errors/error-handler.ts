import type { Result } from 'neverthrow'

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