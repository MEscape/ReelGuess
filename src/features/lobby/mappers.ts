import { mapPlayerRow }   from '@/features/player'
import { LobbyRowSchema } from './validations'
import type { Lobby }     from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a raw `lobbies` DB row (with optional joined players) and maps it
 * to the {@link Lobby} domain type.
 *
 * ### Why `unknown` input
 * The input is raw data from the database or a Supabase Realtime payload.
 * Typing it as `LobbyRow` would require the caller to cast first, defeating
 * the purpose of validation. `unknown` forces all field access through the
 * Zod parse, which is the trust boundary between the DB and the application.
 *
 * ### Player row validation
 * Each element of `players` is passed to `mapPlayerRow`, which runs its own
 * `PlayerRowSchema.parse` internally. Errors from nested player rows surface
 * with a descriptive ZodError path (e.g. `players[2].display_name`).
 *
 * ### Why ZodError propagates
 * Called inside `ResultAsync.fromPromise` wrappers in `queries.ts` and
 * `mutations.ts`. A ZodError thrown here is caught and surfaces as a
 * `LOBBY_DATABASE_ERROR` with a descriptive message instead of a silently
 * corrupted `Lobby`.
 *
 * @throws {ZodError} if `row` does not match {@link LobbyRowSchema}.
 *
 * @internal — not exported from the public barrel. Used only by DAL files.
 */
export function mapLobbyRow(row: unknown): Lobby {
    const validated = LobbyRowSchema.parse(row)

    return {
        id:     validated.id,
        hostId: validated.host_id,
        status: validated.status,
        settings: {
            roundsCount:  validated.settings.rounds_count,
            timerSeconds: validated.settings.timer_seconds,
        },
        // Each player element is independently validated by mapPlayerRow.
        players:   (validated.players ?? []).map((p) => mapPlayerRow(p)),
        createdAt: new Date(validated.created_at),
    }
}