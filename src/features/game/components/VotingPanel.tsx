'use client'

import { PlayerAvatar } from '@/features/player/components/PlayerAvatar'
import type { Player } from '@/features/player/types'

type VotingPanelProps = {
  players: Player[]
  onVote: (votedForId: string) => void
  hasVoted: boolean
  isPending: boolean
  error: string | null
}

export function VotingPanel({
  players,
  onVote,
  hasVoted,
  isPending,
  error,
}: VotingPanelProps) {
  if (hasVoted) {
    return (
      <div className="text-center py-10 card-brutal p-6">
        <div className="text-5xl mb-3">⏳</div>
        <p className="text-xl font-black text-yellow-400 uppercase">Vote Submitted!</p>
        <p className="text-zinc-400 mt-1 text-sm">Waiting for others...</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 text-center mb-3">
        🤔 Who liked this reel?
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => onVote(player.id)}
            disabled={isPending}
            className="flex flex-col items-center gap-2 p-4 min-h-[96px]
              bg-zinc-900 border-2 border-zinc-700 rounded-2xl
              hover:border-yellow-400 hover:bg-zinc-800 hover:-translate-y-[1px] hover:shadow-brutal-yellow
              active:translate-y-[2px] active:shadow-none
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <PlayerAvatar seed={player.avatarSeed} size={52} />
            <span className="font-black text-white text-xs uppercase tracking-wide truncate w-full text-center">
              {player.displayName}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="text-red-500 text-sm font-bold text-center mt-3">{error}</p>
      )}
    </div>
  )
}
