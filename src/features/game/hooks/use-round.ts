'use client'

import { useState, useTransition } from 'react'
import { submitVoteAction } from '../actions'
import { createClient } from '@/lib/supabase/client'
import type { Vote } from '../types'

export function useRound() {
  const [isPending, startTransition] = useTransition()
  const [hasVoted, setHasVoted] = useState(false)
  const [vote, setVote] = useState<Vote | null>(null)
  const [error, setError] = useState<string | null>(null)

  function submitVote(roundId: string, voterId: string, votedForId: string) {
    setError(null)
    startTransition(async () => {
      const result = await submitVoteAction(roundId, voterId, votedForId)

      if (result.ok) {
        setVote(result.value)
        setHasVoted(true)
      } else {
        switch (result.error.type) {
          case 'ALREADY_VOTED':
            setError('You already voted!')
            setHasVoted(true)
            break
          case 'CANNOT_VOTE_SELF':
            setError("You can't vote for yourself!")
            break
          case 'NOT_VOTING_PHASE':
            setError('Voting is not active right now')
            break
          default:
            setError('Failed to submit vote')
        }
      }
    })
  }

  // Check DB if the player already voted for this round (handles page refresh)
  async function checkExistingVote(roundId: string, playerId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('votes')
      .select('id')
      .eq('round_id', roundId)
      .eq('voter_id', playerId)
      .maybeSingle()
    if (data) setHasVoted(true)
  }

  function resetRound() {
    setHasVoted(false)
    setVote(null)
    setError(null)
  }

  return { submitVote, checkExistingVote, isPending, hasVoted, vote, error, resetRound }
}
