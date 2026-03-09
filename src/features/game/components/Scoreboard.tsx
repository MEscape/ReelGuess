'use client'

import { motion } from 'framer-motion'
import { PlayerAvatar } from '@/features/player/components/PlayerAvatar'
import type { ScoreEntry } from '../types'

type ScoreboardProps = {
  scores: ScoreEntry[]
  isFinal?: boolean
}

export function Scoreboard({ scores, isFinal = false }: ScoreboardProps) {
  const sorted = [...scores].sort((a, b) => b.points - a.points)
  const medals = ['🥇', '🥈', '🥉']

  if (sorted.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-zinc-500 text-sm">No scores yet</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-black uppercase text-center text-yellow-400 mb-3 tracking-tight">
        {isFinal ? '🏆 FINAL SCORES' : '📊 SCOREBOARD'}
      </h2>

      {/* Podium – final only */}
      {isFinal && sorted.length >= 1 && (
        <div className="flex justify-center items-end gap-3 mb-6">
          {([1, 0, 2] as number[]).map((idx) => {
            const entry = sorted[idx]
            if (!entry) return <div key={idx} className="w-20" />
            const heights = ['h-28', 'h-20', 'h-14']
            return (
              <motion.div
                key={entry.playerId}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.25, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-2xl">{medals[idx]}</span>
                <PlayerAvatar seed={entry.avatarSeed} size={44} />
                <p className="text-xs font-bold text-white truncate max-w-[72px] text-center">
                  {entry.displayName}
                </p>
                <div className={`w-20 ${heights[idx]} bg-yellow-400/10 border border-yellow-400/20
                  rounded-t-lg flex items-end justify-center pb-2`}>
                  <span className="text-base font-black text-yellow-400">{entry.points}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Score list */}
      <div className="flex flex-col gap-1.5">
        {sorted.map((entry, idx) => (
          <motion.div
            key={entry.playerId}
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.07 }}
            className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900 border border-zinc-800
              rounded-xl shadow-brutal-sm"
          >
            <span className="text-base font-black text-zinc-500 w-5 text-center shrink-0">
              {idx < 3 ? medals[idx] : idx + 1}
            </span>
            <PlayerAvatar seed={entry.avatarSeed} size={32} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate leading-tight">{entry.displayName}</p>
              {entry.streak >= 2 && (
                <p className="text-xs text-orange-400 font-bold leading-tight">🔥 {entry.streak}× streak</p>
              )}
            </div>
            <span className="text-base font-black text-yellow-400 tabular-nums shrink-0">
              {entry.points}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
