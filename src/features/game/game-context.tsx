'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { GamePhase }      from './types'
import type { Round }          from '@/features/round/types'
import type { ReelData }       from '@/features/reel-player/types'
import type { RoundReveal }    from '@/features/reveal/types'
import type { ScoreEntry }     from '@/features/scoring/types'
import type { Player }         from '@/features/player/types'
import type { LobbySettings }  from '@/features/lobby/types'

// ─────────────────────────────────────────────────────────────────────────────
// Session context  (stable lobby-level data — changes rarely)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stable, per-session data that does not change between rounds.
 * Components that only need lobby identity or host status should consume
 * this context instead of the heavier {@link GameRoundContext}.
 */
export type GameSessionValue = {
    /** 6-char lobby code (also the lobby's PK). */
    lobbyId:         string
    /** UUID of the player viewing this page. */
    currentPlayerId: string
    /** True if `currentPlayerId === lobby.hostId`. */
    isHost:          boolean
    /** Lobby settings (rounds count, timer seconds, etc.). */
    settings:        LobbySettings
    /** New lobby code if a rematch was started by any player. */
    rematchId:       string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Round context  (active round state — changes every round)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All state and callbacks for the active round.
 *
 * Populated by `use-game-orchestration` and provided via {@link GameProvider}.
 * Components should prefer {@link useGameSession} when they only need
 * session-level data — it avoids unnecessary re-renders on every vote.
 *
 * Achievements are included in {@link RoundReveal} — `reveal.achievements` —
 * and consumed directly by `RevealScreen`. There is no separate broadcast
 * channel for achievements.
 */
export type GameRoundValue = {
    /** The current active round, or null during pregame. */
    activeRound:   Round | null
    /** Current UI phase — drives which panel is rendered. */
    phase:         GamePhase
    /** Number of votes cast in the current round. */
    voteCount:     number
    /** Live player list (merged with Realtime joins/leaves). */
    livePlayers:   Player[]
    /** Full reveal data, available once phase transitions to `reveal`. */
    reveal:        RoundReveal | null
    /** Error message if the reveal failed to load (null when no error). */
    revealError:   string | null
    /** Current lobby scores, sorted by points descending. */
    scores:        ScoreEntry[]
    /** Reel to display during the voting phase. */
    reelData:      ReelData | null

    // ── Host actions ──────────────────────────────────────────────────────────
    /** Start the next round. No-ops if already pending. Host only. */
    onStartNextRound: () => void
    isStartPending:   boolean
    startError:       string | null

    // ── Voting actions ────────────────────────────────────────────────────────
    /** Submit a vote for the given player UUID. */
    onVote:        (votedForId: string) => void
    isVotePending: boolean
    voteError:     string | null
    hasVoted:      boolean

    // ── Double-or-Nothing ─────────────────────────────────────────────────────
    /** Activate Double-or-Nothing for the given player's vote. */
    onDouble: (roundId: string, voterId: string) => Promise<void>

    // ── Timer callbacks ───────────────────────────────────────────────────────
    /** Called by RoundTimer when the voting countdown reaches zero. */
    onTimerComplete:  () => void
    /** Called by RevealScreen when the reveal countdown reaches zero. */
    onRevealComplete: () => Promise<void>
}

// ─────────────────────────────────────────────────────────────────────────────
// Context instances
// ─────────────────────────────────────────────────────────────────────────────

const GameSessionContext = createContext<GameSessionValue | null>(null)
const GameRoundContext   = createContext<GameRoundValue | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

type GameProviderProps = {
    session:  GameSessionValue
    round:    GameRoundValue
    children: ReactNode
}

/**
 * Provides both {@link GameSessionContext} and {@link GameRoundContext} to the
 * component tree. Place this at the root of the game UI (inside `GameBoard`).
 */
export function GameProvider({ session, round, children }: GameProviderProps) {
    return (
        <GameSessionContext.Provider value={session}>
            <GameRoundContext.Provider value={round}>
                {children}
            </GameRoundContext.Provider>
        </GameSessionContext.Provider>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Consumer hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Access stable session data (lobbyId, isHost, settings).
 * Throws if used outside {@link GameProvider}.
 */
export function useGameSession(): GameSessionValue {
    const ctx = useContext(GameSessionContext)
    if (!ctx) throw new Error('useGameSession must be used inside GameProvider')
    return ctx
}

/**
 * Access active round state and all game action callbacks.
 * Throws if used outside {@link GameProvider}.
 */
export function useGameRound(): GameRoundValue {
    const ctx = useContext(GameRoundContext)
    if (!ctx) throw new Error('useGameRound must be used inside GameProvider')
    return ctx
}