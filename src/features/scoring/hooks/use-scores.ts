'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback }               from 'react'
import { useTranslations }           from 'next-intl'
import { getScoresAction }           from '../actions'
import { gameKeys }                  from '@/lib/query-keys'
import type { ScoreEntry }           from '../types'

export function useScores(lobbyId: string, initialScores: ScoreEntry[]) {
    const queryClient = useQueryClient()
    const t           = useTranslations('errors')

    const { data: scores } = useQuery({
        queryKey:             gameKeys.scores(lobbyId),
        queryFn:              async () => {
            const result = await getScoresAction(lobbyId)
            if (!result.ok) throw new Error(t('unexpectedError'))
            return result.value
        },
        initialData:          initialScores,
        staleTime:            Infinity,
        refetchOnWindowFocus: false,
    })

    const invalidateScores = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: gameKeys.scores(lobbyId) })
    }, [queryClient, lobbyId])

    return { scores, invalidateScores }
}
