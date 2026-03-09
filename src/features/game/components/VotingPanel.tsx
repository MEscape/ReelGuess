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
      <div className="text-center py-8">
        <div className="text-5xl mb-3 animate-bounce">⏳</div>
        <p className="text-xl font-black text-yellow-400 uppercase">Vote Submitted!</p>
        <p className="text-zinc-400 mt-1">Waiting for others...</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-black uppercase text-center text-white mb-4">
        🤔 Who liked this reel?
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => onVote(player.id)}
            disabled={isPending}
            className="flex flex-col items-center gap-2 p-4 bg-zinc-900 border-2 border-zinc-700 rounded-xl
              hover:border-yellow-400 hover:bg-zinc-800
              active:translate-y-[2px] active:shadow-none
              shadow-[3px_3px_0px_0px_rgba(250,204,21,0.3)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all"
          >
            <PlayerAvatar seed={player.avatarSeed} size={56} />
            <span className="font-bold text-white text-sm truncate w-full text-center">
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
