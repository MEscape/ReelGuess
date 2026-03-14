'use client'

import { useCallback }         from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations }             from 'next-intl'
import { startNextRoundAction }        from '../actions'
import { gameKeys }                    from '@/lib/query-keys'
import type { StartRoundActionResult } from '../types'

type UseStartRoundOptions = {
    onSuccess?:      (data: StartRoundActionResult) => void
    onGameFinished?: () => void
}

export function useStartRound(
    lobbyId:      string,
    hostPlayerId: string,
    options:      UseStartRoundOptions = {},
) {
    const queryClient = useQueryClient()
    const t           = useTranslations('game')

    const mutation = useMutation<StartRoundActionResult, Error>({
        mutationFn: async () => {
            const result = await startNextRoundAction(lobbyId, hostPlayerId)
            if (!result.ok) {
                switch (result.error.type) {
                    case 'NO_REELS_AVAILABLE':
                        options.onGameFinished?.()
                        throw new Error(t('noReels'))
                    case 'GAME_ALREADY_FINISHED':
                        options.onGameFinished?.()
                        throw new Error(t('alreadyFinished'))
                    case 'GAME_NOT_HOST':
                        throw new Error(t('onlyHostCanStart'))
                    default:
                        throw new Error(t('failedToStart'))
                }
            }
            return result.value
        },
        onSuccess: (data) => {
            void queryClient.invalidateQueries({ queryKey: gameKeys.scores(lobbyId) })
            options.onSuccess?.(data)
        },
    })

    const startNextRound = useCallback(() => {
        if (mutation.isPending) return
        mutation.mutate()
    }, [mutation])

    return {
        startNextRound,
        isPending: mutation.isPending,
        error:     mutation.isError ? mutation.error.message : null,
        reset:     mutation.reset,
    }
}
