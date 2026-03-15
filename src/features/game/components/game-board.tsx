'use client'

import { useEffect, useRef }     from 'react'
import { motion, AnimatePresence }  from 'framer-motion'

import { GameProvider }             from '../game-context'
import { RoundHeader }              from './round-header'
import { useGameOrchestration }     from '../hooks/use-game-orchestration'

import { VotingPanel }              from '@/features/voting'
import { RevealScreen }             from '@/features/reveal'
import { RoundCompleteScreen }       from '@/features/round'
import { PregameScreen }             from './pregame-screen'
import { GameOverScreen }           from './game-over-screen'
import { ReelDisplay }              from '@/features/reel-player'
import { ReactionBar }              from '@/features/reactions'
import { BannerAd, InterstitialAd, useAds } from '@/features/ads'

import type { Lobby }               from '@/features/lobby'
import type { Round }               from '@/features/round'
import type { ScoreEntry }          from '@/features/scoring'
import type { ReelData }            from '@/features/reel-player'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GameBoardProps = {
    lobby:            Lobby
    currentPlayerId:  string
    initialRound:     Round | null
    initialScores:    ScoreEntry[]
    reelData:         ReelData | null
    initialVoteCount: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation preset (defined outside component — stable reference)
// ─────────────────────────────────────────────────────────────────────────────

const PHASE_TRANSITION = {
    initial:    { opacity: 0, y: 16 },
    animate:    { opacity: 1, y: 0 },
    exit:       { opacity: 0, y: -12 },
    transition: { duration: 0.22, ease: 'easeOut' as const },
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Root of the game UI — mounts the context providers and switches between
 * phase panels based on the current {@link GamePhase}.
 *
 * All orchestration (Realtime, mutations, phase transitions) lives in
 * {@link useGameOrchestration}. This component is purely structural.
 *
 * Achievements flow: `revealRound()` detects them server-side → stored in
 * `reveal.achievements` → `RevealScreen` passes them to `HeroOverlay`.
 * No client-side broadcast merging is needed.
 */
export function GameBoard({
                              lobby,
                              currentPlayerId,
                              initialRound,
                              initialScores,
                              reelData: initialReelData,
                              initialVoteCount,
                          }: GameBoardProps) {
    const isHost = lobby.hostId === currentPlayerId

    const {
        activeRound, phase, voteCount, rematchId,
        livePlayers, lobbyWithPlayers, reveal, revealError, scores, reelData,
        isStartPending, startError,
        isVotePending, voteError, hasVoted,
        onStartNextRound, onVote, onTimerComplete,
        onRevealComplete, onDouble,
    } = useGameOrchestration({
        lobby,
        currentPlayerId,
        initialRound,
        initialScores,
        initialReelData,
        initialVoteCount,
    })

    // ── Ad logic ─────────────────────────────────────────────────────────────
    const { showInterstitial, activeInterstitial, dismissInterstitial } = useAds()
    const prevPhase = useRef(phase)

    useEffect(() => {
        // Trigger interstitial when transitioning from 'reveal' → 'complete'
        // (between rounds, not during active gameplay)
        if (prevPhase.current === 'reveal' && phase === 'complete') {
            showInterstitial('interstitial-game-start')
        }
        prevPhase.current = phase
    }, [phase, showInterstitial])

    // Finished phase bypasses the provider — nothing to render except the end screen.
    if (phase === 'finished') {
        return (
            <GameOverScreen
                scores={scores}
                lobbyId={lobby.id}
                currentPlayerId={currentPlayerId}
                rematchId={rematchId}
            />
        )
    }

    const sessionValue = {
        lobbyId:         lobby.id,
        currentPlayerId,
        isHost,
        settings:        lobby.settings,
        rematchId,
    }

    const roundValue = {
        activeRound, phase, voteCount, livePlayers,
        reveal, revealError, scores,
        reelData, isStartPending, startError,
        isVotePending, voteError, hasVoted,
        onStartNextRound, onVote, onTimerComplete,
        onRevealComplete, onDouble,
    }

    return (
        <GameProvider session={sessionValue} round={roundValue}>
            {/* ── Interstitial overlay (between rounds) ── */}
            {activeInterstitial && (
                <InterstitialAd
                    placement={activeInterstitial as Extract<typeof activeInterstitial, `interstitial-${string}`>}
                    onClose={dismissInterstitial}
                />
            )}

            <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto px-4 pb-8">

                {phase !== 'pregame' && <RoundHeader />}

                <AnimatePresence mode="wait">

                    {phase === 'pregame' && (
                        <motion.div key="pregame" {...PHASE_TRANSITION} className="w-full">
                            {/* lobbyWithPlayers is memoised in useGameOrchestration —
                                stable identity so PregamePanel's memo is not defeated
                                on every vote or score update. */}
                            <PregameScreen lobby={lobbyWithPlayers} />
                        </motion.div>
                    )}

                    {phase === 'voting' && (
                        <motion.div
                            key={`voting-${activeRound?.id}`}
                            {...PHASE_TRANSITION}
                            className="w-full space-y-4"
                        >
                            {reelData && (
                                <ReelDisplay
                                    key={activeRound?.id}
                                    instagramUrl={reelData.instagramUrl}
                                />
                            )}
                            <VotingPanel />
                        </motion.div>
                    )}

                    {phase === 'reveal' && reveal && (
                        <motion.div
                            key={`reveal-${activeRound?.id}`}
                            {...PHASE_TRANSITION}
                            className="w-full"
                        >
                            <RevealScreen />
                            <div className="mt-4">
                                <ReactionBar
                                    lobbyId={lobby.id}
                                    playerId={currentPlayerId}
                                />
                            </div>
                        </motion.div>
                    )}

                    {phase === 'complete' && (
                        <motion.div key="complete" {...PHASE_TRANSITION} className="w-full">
                            <RoundCompleteScreen />
                            {/* Non-intrusive banner between rounds */}
                            <div className="mt-4">
                                <BannerAd placement="banner-round-complete" />
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </GameProvider>
    )
}
