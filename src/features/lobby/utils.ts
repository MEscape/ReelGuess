import { MIN_REELS, submitReelsOnJoinAction, getLocalReels }               from '@/features/reel-import'
import {SAFE_CHARS} from "./constants";

/**
 * Submits the player's full local reel pool to the DB after joining or
 * creating a lobby.
 *
 * ### Design
 * - Sends the entire local pool — `submitReelsOnJoinAction` handles the
 *   server-side shuffle and MAX_REELS cap, preventing the client from
 *   cherry-picking which reels enter the game.
 * - Fire-and-forget: callers navigate regardless of the outcome. The host's
 *   `startGame` validation will catch any player who hasn't submitted reels.
 * - Silently no-ops if the local pool is below `MIN_REELS` — the lobby page
 *   surfaces the missing-reels error when the host tries to start.
 *
 * ### Why extracted from `use-lobby.ts`
 * This function has no React dependencies — it is a plain async utility that
 * builds a FormData and calls a server action. Keeping it in a hook file mixed
 * utility code with React hook code and made it untestable in isolation.
 *
 * @param lobbyId  - The lobby the player just joined or created.
 * @param playerId - The player's UUID in that lobby.
 */
export async function submitLocalReelsToDB(
    lobbyId:  string,
    playerId: string,
): Promise<void> {
    const localPool = getLocalReels()
    if (localPool.length < MIN_REELS) return

    const fd = new FormData()
    fd.set('lobbyId',  lobbyId)
    fd.set('playerId', playerId)
    fd.set('reelUrls', JSON.stringify(localPool.map((r) => r.url)))

    await submitReelsOnJoinAction(fd)
}

/**
 * Generates a random 6-character lobby code.
 * URL-safe, uppercase, easy to read aloud.
 */
export function generateLobbyCode(): string {
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
    }
    return code
}
