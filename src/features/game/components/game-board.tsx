'use client'

import { useState, useCallback, useEffect, useRef, startTransition } from 'react'
import { motion, AnimatePresence }  from 'framer-motion'
import { useQueryClient }           from '@tanstack/react-query'

import { ReelDisplay }        from './reel-display'
import { VotingPanel }        from './voting-panel'
import { RevealScreen }       from './reveal-screen'
import { PregamePanel }       from './pregame-panel'
import { RoundHeader }        from './round-header'
import { BetweenRoundsPanel } from './between-rounds-panel'
import { GameOverScreen }     from './game-over-screen'
import { useGameRealtime }    from '../hooks/use-realtime'
import { useRound }           from '../hooks/use-round'
import { useGameState }       from '../hooks/use-game-state'
import { useScores }          from '../hooks/use-scores'
import { useReelData }        from '../hooks/use-reel-data'
import { usePlayers }         from '@/features/lobby/hooks/use-players'
import { revealRoundAction, completeRoundAction, getCurrentRoundAction } from '../actions'

import { gameKeys }           from '@/lib/query-keys'

import type { Lobby }                           from '@/features/lobby/types'
import type { Round, RoundReveal, GamePhase,
    ReelData, ScoreEntry }            from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type GameBoardProps = {
    lobby:            Lobby
    currentPlayerId:  string
    initialRound:     Round | null
    initialScores:    ScoreEntry[]
    reelData:         ReelData | null
    initialVoteCount: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation preset
// ─────────────────────────────────────────────────────────────────────────────

const phaseTransition = {
    initial:    { opacity: 0, y: 16 },
    animate:    { opacity: 1, y: 0 },
    exit:       { opacity: 0, y: -12 },
    transition: { duration: 0.22, ease: 'easeOut' as const },
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main game board — pure orchestrator.
 *
 * Owns all game state and wires hooks → child components.
 * No display logic lives here; each phase is a dedicated component.
 */
export function GameBoard({
                              lobby,
                              currentPlayerId,
                              initialRound,
                              initialScores,
                              reelData: initialReelData,
                              initialVoteCount,
                          }: GameBoardProps) {
    const isHost    = lobby.hostId === currentPlayerId
    const isHostRef = useRef(isHost)
    useEffect(() => { isHostRef.current = isHost })

    const queryClient = useQueryClient()

    const [reveal,    setReveal]    = useState<RoundReveal | null>(null)
    const [gamePhase, setGamePhase] = useState<'playing' | 'finished'>('playing')

    // Tracks an optimistic pending state: set immediately on host click,
    // cleared once Realtime fires the new round (or on error).
    const pendingRef           = useRef(false)
    const [uiPending, setUiPending] = useState(false)
    const revealingRef         = useRef<string | null>(null)
    const resetVoteCountRef    = useRef<() => void>(() => {})
    // Tracks the last round ID we've processed — prevents resetRound() from
    // firing again for the same round when Realtime re-fires on re-subscribe.
    const prevRoundIdRef       = useRef<string | null>(initialRound?.id ?? null)

    const { scores, invalidateScores } = useScores(lobby.id, initialScores)
    const { submitVote, checkExistingVote,
        isPending: isVotePending, hasVoted,
        error: voteError, resetRound }         = useRound()

    // Live player list — updated via Realtime when players join/leave.
    // Uses the same hook as the lobby page so mid-game joins are reflected.
    const livePlayers = usePlayers(lobby.id, lobby.players)

    // ── Round change handler ──────────────────────────────────────────────────

    const handleRoundChange = useCallback(async (round: Round) => {
        if (pendingRef.current) {
            pendingRef.current = false
            startTransition(() => setUiPending(false))
        }

        if (round.status === 'voting') {
            revealingRef.current = null
            const isNewRound = round.id !== prevRoundIdRef.current
            prevRoundIdRef.current = round.id
            if (isNewRound) {
                resetRound()
                resetVoteCountRef.current()
                setReveal(null)
                // Only re-check votes for genuinely new rounds.
                // The mount useEffect handles the initial refresh case.
                await checkExistingVote(round.id, currentPlayerId)
            }
            if (round.reelId) {
                void queryClient.prefetchQuery({
                    queryKey:  gameKeys.reel(round.reelId),
                    queryFn:   async () => {
                        const res = await fetch(`/api/reel/${round.reelId}`)
                        if (!res.ok) throw new Error('Failed to load reel')
                        return res.json()
                    },
                    staleTime: 60 * 60 * 1000,
                })
            }
        }

        if (round.status === 'reveal') {
            prevRoundIdRef.current = round.id
            revealingRef.current = round.id
            // Non-host clients wait 800 ms so the host's reveal lands first and
            // only one DB write races (the host's). All clients still call
            // revealRoundAction — it's idempotent.
            const delay = isHostRef.current ? 0 : 800
            await new Promise((r) => setTimeout(r, delay))
            const result = await revealRoundAction(round.id)
            if (result.ok) {
                startTransition(() => {
                    setReveal(result.value)
                    invalidateScores()
                })
            }
        }

        if (round.status === 'complete') {
            invalidateScores()
        }
    }, [resetRound, checkExistingVote, currentPlayerId, invalidateScores, queryClient])

    // ── Realtime ──────────────────────────────────────────────────────────────

    const { currentRound, voteCount, lobbyStatus, resetVoteCount } = useGameRealtime(
        lobby.id,
        handleRoundChange,
        initialRound?.id ?? null,
        initialVoteCount,
    )
    useEffect(() => { resetVoteCountRef.current = resetVoteCount }, [resetVoteCount])

    // ── Start next round ─────────────────────────────────────────────────────

    const { startNextRound: doStartNextRound, error: startError } = useGameState(
        lobby.id,
        currentPlayerId,
        (data) => {
            // Pre-populate reel cache immediately on the host's client so the
            // iframe can start loading before Realtime fires for other players.
            queryClient.setQueryData(gameKeys.reel(data.reelId), {
                instagramUrl: data.instagramUrl,
            })
        },
    )

    // ── Reel data ────────────────────────────────────────────────────────────

    const activeRound  = currentRound ?? initialRound
    const activeReelId = activeRound?.reelId ?? null
    const { data: reelData } = useReelData(activeReelId, initialReelData)

    // ── Effects ───────────────────────────────────────────────────────────────

    // Re-hydrate hasVoted on initial mount if a round is already in progress.
    useEffect(() => {
        if (initialRound?.status === 'voting') {
            checkExistingVote(initialRound.id, currentPlayerId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Clear pending state on start error.
    useEffect(() => {
        if (startError && pendingRef.current) {
            pendingRef.current = false
            startTransition(() => setUiPending(false))
        }
    }, [startError])

    // Clear pending state once Realtime confirms the new round is voting.
    useEffect(() => {
        if (pendingRef.current && currentRound?.status === 'voting') {
            pendingRef.current = false
            startTransition(() => setUiPending(false))
        }
    }, [currentRound])

    // Transition to finished screen.
    useEffect(() => {
        if (lobbyStatus === 'finished') startTransition(() => setGamePhase('finished'))
    }, [lobbyStatus])

    // ── Handlers ──────────────────────────────────────────────────────────────

    function handleStartNextRound() {
        pendingRef.current = true
        setUiPending(true)
        doStartNextRound()
    }

    const handleVote = useCallback((votedForId: string) => {
        if (!activeRound) return
        submitVote(activeRound.id, currentPlayerId, votedForId)
    }, [activeRound, currentPlayerId, submitVote])

    // Post-vote poll fallback — if Realtime is slow delivering the auto-reveal
    // (happens when the current player cast the last vote), poll the round
    // status once after 1.5 s. If it's already 'reveal', manually trigger
    // handleRoundChange so the UI transitions without waiting for Realtime.
    const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => {
        if (!hasVoted || !activeRound || activeRound.status !== 'voting') return

        pollTimeoutRef.current = setTimeout(async () => {
            const result = await getCurrentRoundAction(lobby.id)
            if (
                result.ok &&
                result.value &&
                result.value.id === activeRound.id &&
                result.value.status === 'reveal'
            ) {
                void handleRoundChange(result.value)
            }
        }, 1500)

        return () => {
            if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasVoted])

    function handleTimerComplete() {
        if (!isHost || !activeRound || activeRound.status !== 'voting') return
        if (revealingRef.current === activeRound.id) return
        revealingRef.current = activeRound.id
        revealRoundAction(activeRound.id).then((result) => {
            if (result.ok) {
                startTransition(() => {
                    setReveal(result.value)
                    invalidateScores()
                })
            }
        })
    }

    // ── Phase derivation ─────────────────────────────────────────────────────

    const phase: GamePhase =
        gamePhase === 'finished' ? 'finished'  :
            !activeRound             ? 'pregame'   :
                activeRound.status

    // ── Render ───────────────────────────────────────────────────────────────

    if (phase === 'finished') {
        return <GameOverScreen scores={scores} />
    }

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto px-4 pb-safe">

            {/* ── Persistent round header ───────────────────────────── */}
            {phase !== 'pregame' && (
                <RoundHeader
                    roundNumber={activeRound?.roundNumber ?? 0}
                    totalRounds={lobby.settings.roundsCount}
                    phase={phase}
                    timerSeconds={lobby.settings.timerSeconds}
                    startedAt={activeRound?.startedAt}
                    playerCount={livePlayers.length}
                    voteCount={voteCount}
                    onTimerComplete={handleTimerComplete}
                />
            )}

            {/* ── Phase content ─────────────────────────────────────── */}
            <AnimatePresence mode="wait">

                {phase === 'pregame' && (
                    <motion.div key="pregame" {...phaseTransition} className="w-full">
                        <PregamePanel
                            lobby={{ ...lobby, players: livePlayers }}
                            currentPlayerId={currentPlayerId}
                            isHost={isHost}
                            isPending={uiPending}
                            error={startError}
                            onStart={handleStartNextRound}
                        />
                    </motion.div>
                )}

                {phase === 'voting' && (
                    <motion.div
                        key={`voting-${activeRound?.id}`}
                        {...phaseTransition}
                        className="w-full space-y-4"
                    >
                        {reelData && (
                            <ReelDisplay instagramUrl={reelData.instagramUrl} />
                        )}
                        <VotingPanel
                            players={livePlayers}
                            onVote={handleVote}
                            hasVoted={hasVoted}
                            isPending={isVotePending}
                            error={voteError}
                        />
                    </motion.div>
                )}

                {phase === 'reveal' && reveal && (
                    <motion.div
                        key={`reveal-${activeRound?.id}`}
                        {...phaseTransition}
                        className="w-full"
                    >
                        <RevealScreen
                            reveal={reveal}
                            players={livePlayers}
                            isHost={isHost}
                            onRevealCompleteAction={() => completeRoundAction(activeRound!.id)}
                        />
                    </motion.div>
                )}

                {phase === 'complete' && (
                    <motion.div key="between" {...phaseTransition} className="w-full">
                        <BetweenRoundsPanel
                            scores={scores}
                            isHost={isHost}
                            isPending={uiPending}
                            error={startError}
                            nextRound={(activeRound?.roundNumber ?? 0) + 1}
                            totalRounds={lobby.settings.roundsCount}
                            onNext={handleStartNextRound}
                        />
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    )
}