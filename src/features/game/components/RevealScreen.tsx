'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { PlayerAvatar } from '@/features/player/components/PlayerAvatar'
import type { RoundReveal } from '../types'
import type { Player } from '@/features/player/types'

const REVEAL_SECONDS = 6

type RevealScreenProps = {
  reveal: RoundReveal
  players: Player[]
  isHost: boolean
  onRevealCompleteAction: () => void
}

export function RevealScreen({ reveal, players, isHost, onRevealCompleteAction }: RevealScreenProps) {
  const correctPlayer = players.find((p) => p.id === reveal.round.correctPlayerId)
  const [countdown, setCountdown] = useState(REVEAL_SECONDS)
  const [done, setDone] = useState(false)
  const actionCalledRef = useRef(false)

  useEffect(() => {
    actionCalledRef.current = false
    setDone(false)
    setCountdown(REVEAL_SECONDS)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setDone(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [reveal.round.id])

  // Call the action outside of render/interval – only once, only host
  useEffect(() => {
    if (done && isHost && !actionCalledRef.current) {
      actionCalledRef.current = true
      onRevealCompleteAction()
    }
  }, [done, isHost, onRevealCompleteAction])

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-center"
      >
        <div className="text-7xl mb-2">🎉</div>
        <h2 className="text-3xl font-black uppercase text-yellow-400">IT WAS...</h2>
      </motion.div>

      {correctPlayer && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center gap-3 p-6 bg-zinc-900 border-2 border-yellow-400 rounded-2xl
            shadow-[6px_6px_0px_0px_rgba(250,204,21,1)]"
        >
          <PlayerAvatar seed={correctPlayer.avatarSeed} size={80} />
          <p className="text-2xl font-black text-white">{correctPlayer.displayName}</p>
        </motion.div>
      )}

      {/* Vote Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="w-full max-w-sm"
      >
        <h3 className="text-lg font-black text-zinc-300 uppercase mb-3 text-center">Results</h3>
        <div className="space-y-2">
          {reveal.votes.map((vote) => {
            const voter = players.find((p) => p.id === vote.voterId)
            const votedFor = players.find((p) => p.id === vote.votedForId)
            return (
              <div
                key={vote.id}
                className={`flex items-center gap-2 p-2 rounded-lg border ${
                  vote.isCorrect
                    ? 'border-green-400 bg-green-400/10'
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <span className="text-sm">{vote.isCorrect ? '✅' : '❌'}</span>
                <span className="text-sm font-bold text-white">{voter?.displayName}</span>
                <span className="text-xs text-zinc-500">→</span>
                <span className="text-sm text-zinc-400">{votedFor?.displayName}</span>
                {vote.isCorrect && (
                  <span className="ml-auto text-sm font-bold text-green-400">+100</span>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Countdown bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-500 uppercase font-bold">
            {isHost ? 'Next round in...' : 'Waiting for next round...'}
          </span>
          <span className="text-xs font-black text-yellow-400">{countdown}s</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-yellow-400 rounded-full"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: REVEAL_SECONDS, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </div>
  )
}

