'use client'

import { useState, useEffect, useCallback, startTransition, useRef } from 'react'
import { ReelDisplay } from './ReelDisplay'
import { VotingPanel } from './VotingPanel'
import { RevealScreen } from './RevealScreen'
import { Scoreboard } from './Scoreboard'
import { RoundTimer } from './RoundTimer'
import { useGameRealtime } from '../hooks/use-realtime'
import { useRound } from '../hooks/use-round'
import { useGameState } from '../hooks/use-game-state'
import { PlayerAvatar } from '@/features/player/components/PlayerAvatar'
import type { Lobby } from '@/features/lobby/types'
import type { Round, RoundReveal, ScoreEntry } from '../types'
import { revealRoundAction, completeRoundAction, getScoresAction } from '../actions'
import { motion, AnimatePresence } from 'framer-motion'

type GameBoardProps = {
  lobby: Lobby
  currentPlayerId: string
  initialRound: Round | null
  initialScores: ScoreEntry[]
  reelData: { embedHtml: string | null; instagramUrl: string } | null
}

export function GameBoard({
  lobby,
  currentPlayerId,
  initialRound,
  initialScores,
  reelData,
}: GameBoardProps) {
  const isHost = lobby.hostId === currentPlayerId
  const isHostRef = useRef(isHost)
  useEffect(() => { isHostRef.current = isHost })
  const [scores, setScores] = useState<ScoreEntry[]>(initialScores)
  const [reveal, setReveal] = useState<RoundReveal | null>(null)
  const [currentReelData, setCurrentReelData] = useState(reelData)
  const [gamePhase, setGamePhase] = useState<'playing' | 'finished'>('playing')

  // Track whether we're waiting for realtime to confirm the new round
  const pendingRef = useRef(false)
  const [uiPending, setUiPending] = useState(false)
  // Prevent calling revealRoundAction more than once per round
  const revealingRoundRef = useRef<string | null>(null)

  const { submitVote: submitVoteRound, checkExistingVote, isPending: isVotePending, hasVoted, error: voteError, resetRound } = useRound()

  const handleRoundChange = useCallback(async (round: Round) => {
    // New round arrived via realtime – stop loading indicator
    if (pendingRef.current) {
      pendingRef.current = false
      startTransition(() => setUiPending(false))
    }
    if (round.status === 'voting') {
      revealingRoundRef.current = null // reset for new round
      resetRound()
      setReveal(null)
      // Check if player already voted (handles clients that were already in the game)
      await checkExistingVote(round.id, currentPlayerId)
      // Fetch reel url for this round (fast – just a DB read, no oEmbed)
      try {
        const res = await fetch(`/api/reel/${round.reelId}`)
        if (res.ok) {
          const data = await res.json() as { embedHtml: string | null; instagramUrl: string }
          startTransition(() => setCurrentReelData(data))
        }
      } catch { /* keep previous */ }
    }
    // All clients need reveal data to show RevealScreen.
    // Host computes scores (voting→reveal), non-hosts read after a short delay.
    if (round.status === 'reveal' && revealingRoundRef.current !== round.id) {
      revealingRoundRef.current = round.id
      // Non-host: wait briefly so host's score writes are committed first
      const delay = isHostRef.current ? 0 : 800
      await new Promise((r) => setTimeout(r, delay))
      const result = await revealRoundAction(round.id)
      if (result.ok) {
        startTransition(() => {
          setReveal(result.value)
          setScores(result.value.scores)
        })
      }
    }
    // On complete: refresh scores from DB so streak resets are reflected for all clients
    if (round.status === 'complete') {
      const result = await getScoresAction(round.lobbyId)
      if (result.ok) {
        startTransition(() => setScores(result.value))
      }
    }
  }, [resetRound, checkExistingVote, currentPlayerId])

  const { currentRound, voteCount, lobbyStatus, resetVoteCount } = useGameRealtime(
    lobby.id,
    handleRoundChange
  )

  const { startNextRound: doStartNextRound, error: startError } = useGameState(
    lobby.id,
    currentPlayerId,
    // Called when action succeeds – set reelData immediately so host sees it instantly
    (instagramUrl) => {
      startTransition(() => setCurrentReelData({ embedHtml: null, instagramUrl }))
    }
  )

  const activeRound = currentRound ?? initialRound

  function startNextRound() {
    pendingRef.current = true
    setUiPending(true)
    doStartNextRound()
  }

  // On mount: if the round is already in voting phase (e.g. page refresh), check if player voted
  useEffect(() => {
    if (initialRound?.status === 'voting') {
      checkExistingVote(initialRound.id, currentPlayerId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Safety: if action returns an error, stop spinner
  useEffect(() => {
    if (startError && pendingRef.current) {
      pendingRef.current = false
      startTransition(() => setUiPending(false))
    }
  }, [startError])

  // Stop spinner as soon as realtime changes activeRound away from complete/null
  useEffect(() => {
    if (pendingRef.current && currentRound && currentRound.status === 'voting') {
      pendingRef.current = false
      startTransition(() => setUiPending(false))
    }
  }, [currentRound])

  useEffect(() => {
    if (lobbyStatus === 'finished') startTransition(() => setGamePhase('finished'))
  }, [lobbyStatus])

  useEffect(() => {
    if (activeRound?.status === 'countdown') {
      startTransition(() => resetVoteCount())
    }
  }, [activeRound?.id, activeRound?.status, resetVoteCount])

  function handleVote(votedForId: string) {
    if (!activeRound) return
    submitVoteRound(activeRound.id, currentPlayerId, votedForId)
  }

  function handleTimerComplete() {
    if (isHost && activeRound && activeRound.status === 'voting') {
      if (revealingRoundRef.current === activeRound.id) return
      revealingRoundRef.current = activeRound.id
      revealRoundAction(activeRound.id).then((result) => {
        if (result.ok) {
          startTransition(() => {
            setReveal(result.value)
            setScores(result.value.scores)
          })
        }
      })
    }
  }

  if (gamePhase === 'finished') {
    return (
      <div className="flex flex-col items-center gap-6 p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center"
        >
          <div className="text-8xl mb-4">🏆</div>
          <h1 className="text-4xl font-black uppercase text-yellow-400">GAME OVER!</h1>
        </motion.div>
        <Scoreboard scores={scores} isFinal />
      </div>
    )
  }

  const isStartPending = uiPending

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto px-4 pb-safe">
      {/* Round Header */}
      <div className="flex items-center justify-between w-full pt-1">
        <h2 className="text-2xl font-black uppercase text-yellow-400 tracking-tight">
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
        {/* Countdown */}
        {activeRound?.status === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex flex-col items-center py-12"
          >
            <div className="text-7xl font-black text-yellow-400 animate-pulse">GET READY</div>
            <p className="text-zinc-400 mt-2">The reel is coming...</p>
          </motion.div>
        )}

        {/* Voting Phase */}
        {activeRound?.status === 'voting' && (
          <motion.div
            key={`voting-${activeRound.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full space-y-6"
          >
            {currentReelData && (
              <ReelDisplay
                embedHtml={currentReelData.embedHtml}
                instagramUrl={currentReelData.instagramUrl}
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
              <p className="text-center text-zinc-400 text-sm">
                {voteCount} / {lobby.players.length} voted
              </p>
            )}
          </motion.div>
        )}

        {/* Reveal Phase */}
        {activeRound?.status === 'reveal' && reveal && (
          <motion.div
            key={`reveal-${activeRound.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <RevealScreen
              reveal={reveal}
              players={lobby.players}
              isHost={isHost}
              onRevealCompleteAction={() => completeRoundAction(activeRound.id)}
            />
          </motion.div>
        )}

        {/* Before first round */}
        {!activeRound && (
          <motion.div
            key="pregame"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-5"
          >
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-black uppercase text-zinc-400 mb-3">
                👥 Players ({lobby.players.length})
              </h3>
              <div className="flex flex-col gap-2">
                {lobby.players.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-1">
                    <PlayerAvatar seed={p.avatarSeed} size={32} />
                    <span className="font-bold text-white text-sm">{p.displayName}</span>
                    {p.id === lobby.hostId && (
                      <span className="ml-auto text-xs text-yellow-400 font-black">HOST</span>
                    )}
                    {p.id === currentPlayerId && p.id !== lobby.hostId && (
                      <span className="ml-auto text-xs text-zinc-500 font-bold">YOU</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {isHost ? (
              <>
                <button
                  onClick={startNextRound}
                  disabled={isStartPending}
                  className="w-full min-h-[56px] bg-yellow-400 text-black font-black uppercase text-xl px-6
                    border-2 border-black rounded-xl shadow-brutal
                    hover:translate-y-[2px] hover:shadow-brutal-sm
                    active:translate-y-[4px] active:shadow-none
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-brutal
                    transition-all duration-200"
                >
                  {isStartPending ? '⏳ STARTING...' : '▶️ START GAME'}
                </button>
                {startError && (
                  <p className="text-red-500 text-sm font-bold text-center">{startError}</p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 py-4">
                <span className="animate-pulse text-yellow-400 text-lg">⏳</span>
                <p className="text-zinc-400 text-center text-sm font-bold">
                  Waiting for host to start the game...
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Between Rounds */}
        {activeRound?.status === 'complete' && (
          <motion.div
            key="between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full space-y-6"
          >
            <Scoreboard scores={scores} />
            {isHost && (
              <button
                onClick={startNextRound}
                disabled={isStartPending}
                className="w-full min-h-[56px] bg-yellow-400 text-black font-black uppercase text-xl px-6
                  border-2 border-black rounded-xl shadow-brutal
                  hover:translate-y-[2px] hover:shadow-brutal-sm
                  active:translate-y-[4px] active:shadow-none
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-brutal
                  transition-all duration-200"
              >
                {isStartPending ? '⏳ STARTING...' : '▶️ NEXT ROUND'}
              </button>
            )}
            {startError && (
              <p className="text-red-500 text-sm font-bold text-center">{startError}</p>
            )}
            {!isHost && (
              <p className="text-zinc-400 text-center text-sm">
                Waiting for host to start next round...
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

