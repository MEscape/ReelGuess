'use client'

import { useState, useCallback, useEffect, useRef, startTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { ReelDisplay }       from './ReelDisplay'
import { VotingPanel }       from './VotingPanel'
import { RevealScreen }      from './RevealScreen'
import { Scoreboard }        from './Scoreboard'
import { RoundTimer }        from './RoundTimer'
import { PregamePanel }      from './PregamePanel'

import { useGameRealtime }   from '../hooks/use-realtime'
import { useRound }          from '../hooks/use-round'
import { useGameState }      from '../hooks/use-game-state'
import { useScores }         from '../hooks/use-scores'
import { useReelData }       from '../hooks/use-reel-data'
import { revealRoundAction, completeRoundAction } from '../actions'

import { Button, ErrorMessage } from '@/components/ui'

import type { Lobby }        from '@/features/lobby/types'
import type { Round, RoundReveal, GamePhase, ReelData } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type GameBoardProps = {
    lobby:         Lobby
    currentPlayerId: string
    initialRound:  Round | null
    initialScores: import('../types').ScoreEntry[]
    reelData:      ReelData | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main game board — thin phase router.
 *
 * All state lives in dedicated hooks:
 * - {@link useGameRealtime}  — Supabase real-time subscriptions
 * - {@link useRound}         — vote submission
 * - {@link useGameState}     — start-next-round
 * - {@link useScores}        — React Query cached scores
 * - {@link useReelData}      — React Query cached reel embed
 *
 * This component only decides *which* phase UI to render.
 */
export function GameBoard({
                              lobby,
                              currentPlayerId,
                              initialRound,
                              initialScores,
                              reelData: initialReelData,
                          }: GameBoardProps) {
    const isHost    = lobby.hostId === currentPlayerId
    const isHostRef = useRef(isHost)
    useEffect(() => { isHostRef.current = isHost })

    // ── Derived phase state ─────────────────────────────────────────────────
    const [reveal,    setReveal]    = useState<RoundReveal | null>(null)
    const [gamePhase, setGamePhase] = useState<'playing' | 'finished'>('playing')

    // Spinner while waiting for Realtime to confirm the new round
    const pendingRef  = useRef(false)
    const [uiPending, setUiPending] = useState(false)

    // Prevent calling revealRoundAction more than once per round
    const revealingRef = useRef<string | null>(null)

    // ── Sub-hooks ───────────────────────────────────────────────────────────
    const { scores, invalidateScores }                               = useScores(lobby.id, initialScores)
    const { submitVote, checkExistingVote, isPending: isVotePending,
        hasVoted, error: voteError, resetRound }                  = useRound()

    // Active reel — React Query caches per-reel for 1h
    const activeReelId = initialRound?.reelId ?? null
    const { data: reelData, refetch: refetchReel }                   = useReelData(activeReelId, initialReelData)

    // ── Round-change handler ────────────────────────────────────────────────
    const handleRoundChange = useCallback(async (round: Round) => {
        // Stop loading spinner once the new round arrives
        if (pendingRef.current) {
            pendingRef.current = false
            startTransition(() => setUiPending(false))
        }

        if (round.status === 'voting') {
            revealingRef.current = null
            resetRound()
            setReveal(null)
            await checkExistingVote(round.id, currentPlayerId)
            // Reel data is cached by React Query — refetch triggers if not cached
            refetchReel()
        }

        if (round.status === 'reveal' && revealingRef.current !== round.id) {
            revealingRef.current = round.id
            // Non-host waits briefly so host's score writes commit first
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
    }, [resetRound, checkExistingVote, currentPlayerId, invalidateScores, refetchReel])

    const { currentRound, voteCount, lobbyStatus, resetVoteCount } = useGameRealtime(
        lobby.id,
        handleRoundChange,
    )

    const { startNextRound: doStartNextRound, error: startError } = useGameState(
        lobby.id,
        currentPlayerId,
        (instagramUrl) => {
            // Host sees reel immediately (before Realtime fires)
            startTransition(() => {
                // Reel cache will be seeded once Realtime fires the new round
            })
        },
    )

    const activeRound = currentRound ?? initialRound

    // ── Lifecycle effects ───────────────────────────────────────────────────

    // On mount: re-check vote state for page-refresh during voting
    useEffect(() => {
        if (initialRound?.status === 'voting') {
            checkExistingVote(initialRound.id, currentPlayerId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Stop spinner if action errored
    useEffect(() => {
        if (startError && pendingRef.current) {
            pendingRef.current = false
            startTransition(() => setUiPending(false))
        }
    }, [startError])

    // Stop spinner once Realtime confirms new round
    useEffect(() => {
        if (pendingRef.current && currentRound?.status === 'voting') {
            pendingRef.current = false
            startTransition(() => setUiPending(false))
        }
    }, [currentRound])

    // Lobby finished
    useEffect(() => {
        if (lobbyStatus === 'finished') startTransition(() => setGamePhase('finished'))
    }, [lobbyStatus])

    // Reset vote count on new round start
    useEffect(() => {
        if (activeRound?.status === 'countdown') resetVoteCount()
    }, [activeRound?.id, activeRound?.status, resetVoteCount])

    // ── Actions ─────────────────────────────────────────────────────────────

    function handleStartNextRound() {
        pendingRef.current = true
        setUiPending(true)
        doStartNextRound()
    }

    const handleVote = useCallback((votedForId: string) => {
        if (!activeRound) return
        submitVote(activeRound.id, currentPlayerId, votedForId)
    }, [activeRound, currentPlayerId, submitVote])

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

    // ── Determine current UI phase ──────────────────────────────────────────
    const phase: GamePhase =
        gamePhase === 'finished'     ? 'finished'  :
            !activeRound                 ? 'pregame'   :
                activeRound.status

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    if (phase === 'finished') {
        return (
            <div className="flex flex-col items-center gap-6 p-4">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-center"
                >
                    <div className="text-8xl mb-4">🏆</div>
                    <h1 className="text-4xl font-black uppercase text-[var(--color-accent)]">GAME OVER!</h1>
                </motion.div>
                <Scoreboard scores={scores} isFinal />
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto px-4 pb-safe">
            {/* Round header */}
            <div className="flex items-center justify-between w-full pt-1">
                <h2 className="text-2xl font-black uppercase text-[var(--color-accent)] tracking-tight">
                    Round {activeRound?.roundNumber ?? 0} / {lobby.settings.roundsCount}
                </h2>
                {activeRound?.status === 'voting' && (
                    <RoundTimer
                        seconds={lobby.settings.timerSeconds}
                        isActive
                        onComplete={handleTimerComplete}
                    />
                )}
            </div>

            <AnimatePresence mode="wait">
                {/* Pre-game */}
                {phase === 'pregame' && (
                    <motion.div
                        key="pregame"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        <PregamePanel
                            lobby={lobby}
                            currentPlayerId={currentPlayerId}
                            isHost={isHost}
                            isPending={uiPending}
                            error={startError}
                            onStart={handleStartNextRound}
                        />
                    </motion.div>
                )}

                {/* Countdown */}
                {phase === 'countdown' && (
                    <motion.div
                        key="countdown"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex flex-col items-center py-12"
                    >
                        <div className="text-7xl font-black text-[var(--color-accent)] animate-pulse">GET READY</div>
                        <p className="text-[var(--color-muted)] mt-2">The reel is coming…</p>
                    </motion.div>
                )}

                {/* Voting */}
                {phase === 'voting' && (
                    <motion.div
                        key={`voting-${activeRound?.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full space-y-6"
                    >
                        {reelData && (
                            <ReelDisplay
                                instagramUrl={reelData.instagramUrl}
                            />
                        )}
                        <VotingPanel
                            players={lobby.players}
                            onVote={handleVote}
                            hasVoted={hasVoted}
                            isPending={isVotePending}
                            error={voteError}
                        />
                        {hasVoted && (
                            <p className="text-center text-[var(--color-subtle)] text-sm">
                                {voteCount} / {lobby.players.length} voted
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Reveal */}
                {phase === 'reveal' && reveal && (
                    <motion.div
                        key={`reveal-${activeRound?.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        <RevealScreen
                            reveal={reveal}
                            players={lobby.players}
                            isHost={isHost}
                            onRevealCompleteAction={() => completeRoundAction(activeRound!.id)}
                        />
                    </motion.div>
                )}

                {/* Between rounds */}
                {phase === 'complete' && (
                    <motion.div
                        key="between"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full space-y-6"
                    >
                        <Scoreboard scores={scores} />
                        {isHost ? (
                            <>
                                <Button
                                    size="lg"
                                    fullWidth
                                    onClick={handleStartNextRound}
                                    disabled={uiPending}
                                >
                                    {uiPending ? '⏳ STARTING…' : '▶️ NEXT ROUND'}
                                </Button>
                                <ErrorMessage message={startError} />
                            </>
                        ) : (
                            <p className="text-[var(--color-subtle)] text-center text-sm">
                                Waiting for host to start next round…
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
