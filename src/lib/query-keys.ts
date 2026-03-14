/**
 * React Query key factory.
 *
 * Centralises all cache keys. Use these everywhere — never write raw key
 * arrays inline. Mismatched keys cause stale cache bugs that are hard to trace.
 *
 * @example
 * ```ts
 * useQuery({ queryKey: gameKeys.scores(lobbyId), … })
 * queryClient.invalidateQueries({ queryKey: gameKeys.scores(lobbyId) })
 * ```
 */

export const gameKeys = {
    all:    ['game'] as const,
    round:  (lobbyId: string)  => ['game', 'round',  lobbyId]  as const,
    scores: (lobbyId: string)  => ['game', 'scores', lobbyId]  as const,
    votes:  (roundId: string)  => ['game', 'votes',  roundId]  as const,
    reel:   (reelId: string)   => ['game', 'reel',   reelId]   as const,
}
