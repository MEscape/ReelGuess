import { ok, err }                        from 'neverthrow'
import { getCurrentRound, getRoundById }  from './queries'
import { createRound, updateRoundStatus } from './mutations'
import { updateLobbyStatus, getLobbyByCode }              from '@/features/lobby'
import { getUnusedReels, markReelUsed, unmarkReelUsed }                 from '@/features/reel-import'
import type { GameResult }                from '@/features/game'
import type { StartRoundActionResult }    from './types'

// ─────────────────────────────────────────────────────────────────────────────
// startNextRound
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Starts the next round for a lobby.
 *
 * Business rules:
 * - Caller must be the lobby host (verified against DB, not just client claim).
 * - Round count must not exceed `lobby.settings.roundsCount`.
 * - A random unused reel is selected and marked used.
 * - Reel rotation: the same reel never plays twice in a row (when >1 unused
 *   reel exists).
 *
 * ### TOCTOU handling
 * If two concurrent host clicks race to insert the same round number, the
 * second insert will fail (unique constraint on `lobby_id, round_number`).
 * We attempt to roll back the reel mark on failure to avoid consuming a reel
 * with no associated round. If the rollback itself fails, the consumed reel
 * slot is logged — data loss is possible in this edge case but surfaced in
 * logs rather than silently discarded.
 *
 * @param lobbyId      - 6-char lobby code.
 * @param hostPlayerId - Must match `lobby.hostId` in the DB.
 */
export async function startNextRound(
    lobbyId:      string,
    hostPlayerId: string,
): Promise<GameResult<StartRoundActionResult>> {
    const lobbyResult = await getLobbyByCode(lobbyId)
    if (lobbyResult.isErr()) return err({ type: 'GAME_DATABASE_ERROR', message: 'Lobby not found' })

    const lobby = lobbyResult.value
    if (lobby.hostId !== hostPlayerId) return err({ type: 'GAME_NOT_HOST', playerId: hostPlayerId })

    const currentRoundResult = await getCurrentRound(lobbyId)
    if (currentRoundResult.isErr()) return err(currentRoundResult.error)

    const nextRoundNumber = (currentRoundResult.value?.roundNumber ?? 0) + 1
    if (nextRoundNumber > lobby.settings.roundsCount) {
        return err({ type: 'GAME_ALREADY_FINISHED', lobbyId })
    }

    const unusedReelsResult = await getUnusedReels(lobbyId)
    if (unusedReelsResult.isErr()) return err({ type: 'NO_REELS_AVAILABLE', lobbyId })

    const unusedReels = unusedReelsResult.value
    if (unusedReels.length === 0) return err({ type: 'NO_REELS_AVAILABLE', lobbyId })

    // Exclude the last-used reel to prevent consecutive repetition.
    // If only one reel remains, reuse it — there is no alternative.
    const lastReelId  = currentRoundResult.value?.reelId ?? null
    const candidates  = unusedReels.length > 1 && lastReelId
        ? unusedReels.filter((r) => r.id !== lastReelId)
        : unusedReels

    const chosen = candidates[Math.floor(Math.random() * candidates.length)]

    const markResult = await markReelUsed(chosen.id)
    if (markResult.isErr()) return err({ type: 'GAME_DATABASE_ERROR', message: 'Failed to mark reel used' })

    const roundResult = await createRound(lobbyId, nextRoundNumber, chosen.id, chosen.ownerId)
    if (roundResult.isErr()) {
        // Roll back reel mark — the round failed to insert (likely a concurrent
        // duplicate) and we must not consume a reel slot for nothing.
        const rollbackResult = await unmarkReelUsed(chosen.id)
        if (rollbackResult.isErr()) {
            // Rollback failed — the reel slot is consumed with no round.
            // Log for ops visibility; do not surface to the user.
            console.error(
                '[startNextRound] reel rollback failed after round insert error',
                { reelId: chosen.id, roundError: roundResult.error },
            )
        }
        return err(roundResult.error)
    }

    return ok({ ...roundResult.value, instagramUrl: chosen.instagramUrl })
}

// ─────────────────────────────────────────────────────────────────────────────
// completeRound
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Marks a round as `complete`. Called by the host after the reveal timer ends.
 *
 * ### Lobby transition — best-effort
 * If this was the final round, we attempt to transition the lobby to
 * `finished`. This fires a Realtime UPDATE that drives all clients to
 * `GameOverScreen`. The transition is **best-effort** — if the lobby fetch or
 * status update fails, `completeRound` still returns `ok`. Rationale:
 * - Round completion is the critical path; the lobby update is a convenience.
 * - Realtime will eventually deliver the correct lobby state to clients.
 * - Failing the whole action on a lobby-update failure forces the host to
 *   retry, which produces a worse user experience than a silent best-effort.
 * Failures are logged for ops visibility.
 *
 * @param roundId - The round to mark complete.
 */
export async function completeRound(roundId: string): Promise<GameResult<void>> {
    const roundResult = await getRoundById(roundId)
    if (roundResult.isErr()) return err(roundResult.error)

    const round = roundResult.value

    const statusResult = await updateRoundStatus(roundId, 'complete')
    if (statusResult.isErr()) return err(statusResult.error)

    // Best-effort lobby transition — see JSDoc for rationale.
    const lobbyResult = await getLobbyByCode(round.lobbyId)
    if (lobbyResult.isErr()) {
        console.error('[completeRound] failed to fetch lobby for finished check', {
            roundId,
            lobbyId: round.lobbyId,
            error:   lobbyResult.error,
        })
        return ok(undefined)
    }

    const lobby = lobbyResult.value
    if (round.roundNumber >= lobby.settings.roundsCount) {
        const finishedResult = await updateLobbyStatus(round.lobbyId, 'finished')
        if (finishedResult.isErr()) {
            console.error('[completeRound] failed to transition lobby to finished', {
                roundId,
                lobbyId: round.lobbyId,
                error:   finishedResult.error,
            })
        }
    }

    return ok(undefined)
}
