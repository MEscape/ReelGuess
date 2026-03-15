'use client'

import { useState, useCallback, useEffect, useRef, useMemo }  from 'react'
import { useGameRealtime }                                    from './use-game-realtime'
import { usePageVisibilityRefresh }                           from './use-page-visibility-refresh'
import { usePollForReveal, useRevealFlow, revealRoundAction } from "@/features/reveal"
import { useStartRound, completeRoundAction }                 from '@/features/round'
import { useVote, submitDoubleAction }                        from '@/features/voting'
import { useReelData }                                        from '@/features/reel-player'
import { usePlayers }                                         from '@/features/player'
import { useScores }                                          from '@/features/scoring'
import type { GamePhase }  from '@/features/game'
import type { Lobby }      from '@/features/lobby'
import type { ScoreEntry } from '@/features/scoring'
import type { ReelData }   from '@/features/reel-player'
import type { Round }      from '@/features/round'
import type { Player }     from '@/features/player'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type UseGameOrchestrationInput = {
    lobby:            Lobby
    currentPlayerId:  string
    initialRound:     Round | null
    initialScores:    ScoreEntry[]
    initialReelData:  ReelData | null
    initialVoteCount: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Coordinates all game sub-features for a single lobby session.
 *
 * This hook is a pure coordinator — it composes sub-feature hooks and wires
 * their outputs together. No business logic lives here; each concern is
 * delegated to its own focused hook:
 *
 * | Concern              | Hook                  |
 * |----------------------|-----------------------|
 * | Round lifecycle      | useStartRound         |
 * | Vote submission      | useVote               |
 * | Reveal & scoring     | useRevealFlow         |
 * | Score display        | useScores             |
 * | Reel data            | useReelData           |
 * | Realtime events      | useGameRealtime       |
 * | Live players         | usePlayers            |
 * | Reveal poll fallback | usePollForReveal      |
 *
 * The returned value is passed directly into GameProvider by GameBoard.
 *
 * ### Host guards on timer callbacks
 * `onTimerComplete` and `onRevealComplete` fire server actions. Both guard
 * with `if (!isHost) return` as the first statement — the callbacks are wired
 * to UI components on all clients (host and guest share the same component
 * tree), so the guard must live in the callback itself, not in the component.
 */
export function useGameOrchestration({
                                         lobby,
                                         currentPlayerId,
                                         initialRound,
                                         initialScores,
                                         initialReelData,
                                         initialVoteCount,
                                     }: UseGameOrchestrationInput) {
    const isHost = lobby.hostId === currentPlayerId

    // ── Core state ───────────────────────────────────────────────────────────
    const [phase, setPhase]             = useState<GamePhase>(
        () => initialRound?.status ?? 'pregame',
    )
    const [activeRound, setActiveRound] = useState<Round | null>(initialRound)

    /**
     * Always holds the current phase value.
     * Read by `usePollForReveal` and timer callbacks without creating stale closures.
     */
    const phaseRef = useRef<GamePhase>(phase)
    useEffect(() => { phaseRef.current = phase }, [phase])

    // ── Sub-feature hooks ────────────────────────────────────────────────────
    const { scores, invalidateScores } = useScores(lobby.id, initialScores)
    const livePlayers                  = usePlayers(lobby.id, lobby.players)

    // Stable lobby+players object for PregamePanel — avoids defeating its memo
    // by creating a new object reference on every render.
    const lobbyWithPlayers = useMemo(
        () => ({ ...lobby, players: livePlayers as Player[] }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [lobby.id, livePlayers],
    )

    const { data: reelData } = useReelData(
        activeRound?.reelId ?? null,
        initialReelData,
        initialRound?.reelId ?? null,
    )

    const { reveal, fetchReveal, clearReveal, revealError } = useRevealFlow({
        onRevealReady: () => { invalidateScores() },
    })

    const { startNextRound, isPending: isStartPending, error: startError } = useStartRound(
        lobby.id,
        currentPlayerId,
        {
            onSuccess: (result) => {
                setActiveRound(result)
                setPhase('voting')
                clearReveal()
            },
            onGameFinished: () => setPhase('finished'),
        },
    )

    // ── Poll fallback ────────────────────────────────────────────────────────
    const { poll: pollForReveal } = usePollForReveal({
        lobbyId:          lobby.id,
        phaseRef,
        onRevealDetected: () => setPhase('reveal'),
    })

    const {
        submitVote,
        isPending: isVotePending,
        hasVoted,
        error:     voteError,
        resetVote,
    } = useVote({
        currentPlayerId,
        onVoteSettled: pollForReveal,
    })

    // ── Realtime subscription ────────────────────────────────────────────────
    const { voteCount, lobbyStatus, rematchId, resetVoteCount } = useGameRealtime(
        lobby.id,
        (round) => {
            if (round.status === 'voting') {
                // Reset startedAt to now so the timer starts from the full duration.
                // Without this, the timer would show reduced time because `startedAt`
                // in the DB reflects when the round row was inserted — by the time the
                // Realtime event arrives on the client, a few seconds may have already
                // elapsed, causing the timer to start mid-countdown.
                // Page-refresh resumption uses `initialRound.startedAt` directly
                // (set once at mount, not overwritten here).
                setActiveRound({ ...round, startedAt: new Date() })
                setPhase('voting')
                resetVote()
                resetVoteCount()
                clearReveal()
            } else {
                setActiveRound(round)
            }
            if (round.status === 'reveal')   setPhase('reveal')
            if (round.status === 'complete') setPhase('complete')
        },
        activeRound?.id ?? null,
        initialVoteCount,
        lobby.settings.rematchId ?? null,
    )

    // Transition to finished when the lobby status changes via Realtime.
    useEffect(() => {
        if (lobbyStatus === 'finished') setPhase('finished')
    }, [lobbyStatus])

    // Load reveal data once when phase transitions to 'reveal'.
    useEffect(() => {
        if (phase !== 'reveal' || !activeRound) return
        void fetchReveal(activeRound.id)
    }, [phase, activeRound?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Action callbacks ─────────────────────────────────────────────────────

    const onVote = useCallback((votedForId: string) => {
        if (!activeRound) return
        submitVote(activeRound.id, currentPlayerId, votedForId)
    }, [activeRound, currentPlayerId, submitVote])

    /**
     * Called by RoundTimer when the voting countdown expires.
     *
     * Guards with `isHost` as the first statement — the timer component runs
     * on all clients but only the host should fire the reveal action.
     */
    const onTimerComplete = useCallback(() => {
        if (!isHost || !activeRound || phaseRef.current !== 'voting') return
        void revealRoundAction(activeRound.id)
    }, [isHost, activeRound])

    /**
     * Called by RevealScreen when the reveal countdown expires.
     *
     * Guards with `isHost` — same reasoning as `onTimerComplete`.
     * Only the host advances the round to `complete`.
     */
    const onRevealComplete = useCallback(async (): Promise<void> => {
        if (!isHost || !activeRound) return
        void completeRoundAction(activeRound.id)
        setPhase('complete')
        invalidateScores()
    }, [isHost, activeRound, invalidateScores])

    /**
     * Activates Double-or-Nothing for the given player's vote.
     *
     * Logs errors but does not surface them to the user — the Double button
     * is a secondary mechanic and a silent failure is preferable to a
     * disruptive error state mid-round.
     */
    const onDouble = useCallback(async (roundId: string, voterId: string) => {
        const result = await submitDoubleAction(roundId, voterId)
        if (!result.ok) {
            console.error('[useGameOrchestration] submitDoubleAction failed', result.error)
        }
    }, [])

    // ── Page visibility refresh ──────────────────────────────────────────────
    // When the user returns to the tab after it was hidden, Realtime events
    // are not replayed. Re-fetch scores and snap to the correct phase based
    // on the server's current round status.
    usePageVisibilityRefresh({
        lobbyId:          lobby.id,
        phaseRef,
        invalidateScores,
        onPhaseChange: (serverStatus) => {
            if (serverStatus === 'voting') {
                setPhase('voting')
            } else if (serverStatus === 'reveal') {
                setPhase('reveal')
                if (activeRound) void fetchReveal(activeRound.id)
            } else if (serverStatus === 'complete') {
                setPhase('complete')
            }
        },
    })

    return {
        activeRound,
        phase,
        voteCount,
        rematchId,
        livePlayers,
        lobbyWithPlayers,
        reveal,
        revealError,
        scores,
        reelData:         reelData ?? null,
        isStartPending,
        startError,
        isVotePending,
        voteError,
        hasVoted,
        onStartNextRound: startNextRound,
        onVote,
        onTimerComplete,
        onRevealComplete,
        onDouble,
    }
}