import { z } from 'zod'
import {MIN_REELS} from "./constants";

/**
 * Validates the payload for submitting a player's local reel pool on lobby join.
 *
 * `reelUrls` is the full local pool (no cap yet) — this action applies
 * `selectGameReels` to randomly pick and cap at MAX_REELS server-side,
 * preventing a client from cherry-picking which reels enter the game.
 *
 * `lobbyId` applies the same uppercase + regex validation as `LobbyCodeSchema`
 * in the lobby feature. A lowercase or malformed code is rejected here before
 * reaching the DB FK constraint.
 */
export const SubmitReelsSchema = z.object({
    lobbyId:  z
        .string()
        .length(6)
        .toUpperCase()
        .regex(/^[A-Z0-9]{6}$/, 'Invalid lobby code format'),
    playerId: z.string().uuid(),
    reelUrls: z
        .array(z.string().url())
        .min(MIN_REELS, `You need at least ${MIN_REELS} reels to play`),
})

export type SubmitReelsInput = z.infer<typeof SubmitReelsSchema>

/** Matches a clean Instagram Reel URL (no query params). */
export const InstagramReelUrlSchema = z.string().regex(
    /^https?:\/\/(?:www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/,
    "Invalid Instagram reel URL"
)

export type InstagramReelUrl = z.infer<typeof InstagramReelUrlSchema>

// ─────────────────────────────────────────────────────────────────────────────
// DB row schema and type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runtime validation schema for raw `reels` DB rows.
 *
 * Used by `mapReelRow` in `mappers.ts` as the trust boundary between the
 * database and the application. If any field is missing, the wrong type, or
 * `instagram_url` is not a valid URL, the parse throws a ZodError caught by
 * the DAL's ResultAsync wrapper.
 *
 * `created_at` uses `.datetime()` so a null or malformed timestamp produces
 * a descriptive ZodError instead of silently becoming an invalid Date.
 *
 * @internal — not exported from the public barrel. Consumers use {@link Reel}.
 */
export const ReelRowSchema = z.object({
    id:            z.string().uuid(),
    lobby_id:      z.string(),
    owner_id:      z.string().uuid(),
    instagram_url: z.string().url(),
    used:          z.boolean(),
    /** ISO 8601 timestamp string — enforced at parse time. */
    created_at:    z.string().datetime({ offset: true }),
})

/**
 * Raw DB row from the `reels` table.
 * Derived from {@link ReelRowSchema} so the type and validator stay in sync.
 *
 * @internal — not exported from the public barrel. Consumers use {@link Reel}.
 */
export type ReelRow = z.infer<typeof ReelRowSchema>

/**
 * Validates the partial row shape returned by queries that select only
 * `id`, `owner_id`, and `instagram_url` (no `used`, `lobby_id`, `created_at`).
 *
 * Local to `queries.ts` — not exported. Each field cast that existed before
 * is replaced by a `.parse()` call so schema drift surfaces as a ZodError
 * rather than silently producing `undefined as string`.
 */
export const UnusedReelRowSchema = z.object({
    id:            z.string().uuid(),
    owner_id:      z.string().uuid(),
    instagram_url: z.string().url(),
})