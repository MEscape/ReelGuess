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

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-black uppercase text-center text-yellow-400 mb-4">
        {isFinal ? '🏆 FINAL SCORES' : '📊 SCOREBOARD'}
      </h2>

      {/* Top 3 podium for final */}
      {isFinal && sorted.length >= 1 && (
        <div className="flex justify-center items-end gap-4 mb-8">
          {[1, 0, 2].map((idx) => {
            const entry = sorted[idx]
            if (!entry) return <div key={idx} className="w-20" />
            const height = idx === 0 ? 'h-32' : idx === 1 ? 'h-24' : 'h-16'
            return (
              <motion.div
                key={entry.playerId}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.3 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-3xl">{medals[idx]}</span>
                <PlayerAvatar seed={entry.avatarSeed} size={48} />
                <p className="text-sm font-bold text-white truncate max-w-20">
                  {entry.displayName}
                </p>
                <div className={`w-20 ${height} bg-gradient-to-t from-yellow-400/20 to-yellow-400/5 
                  border border-yellow-400/30 rounded-t-lg flex items-center justify-center`}>
                  <span className="text-lg font-black text-yellow-400">{entry.points}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {sorted.map((entry, idx) => (
          <motion.div
            key={entry.playerId}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg"
          >
            <span className="text-lg font-black text-zinc-500 w-6 text-center">
              {idx < 3 ? medals[idx] : `${idx + 1}`}
            </span>
            <PlayerAvatar seed={entry.avatarSeed} size={32} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{entry.displayName}</p>
              {entry.streak > 1 && (
                <p className="text-xs text-orange-400 font-bold">
                  🔥 {entry.streak} streak
                </p>
              )}
            </div>
            <span className="text-lg font-black text-yellow-400">{entry.points}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

