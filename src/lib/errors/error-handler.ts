import type { Result } from 'neverthrow'
import type { AppError } from './base-errors'

/**
 * Serialize a Result for sending from Server Actions to the client.
 * Server Actions can't return class instances, so we serialize to plain objects.
 */
export type SerializedResult<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export function serializeResult<T, E>(result: Result<T, E>): SerializedResult<T, E> {
  return result.match(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, error })
  )
}
