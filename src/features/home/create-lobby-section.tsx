'use client'

import { useState }             from 'react'
import { useTranslations }      from 'next-intl'
import { useCreateLobby }       from '@/features/lobby/hooks/use-lobby'
import { PlayerNameForm }       from '@/features/player/components/player-name-form'
import { ErrorMessage, Button } from '@/components/ui'
import { useLocalReels }        from '@/features/reel-import/hooks/use-local-reels'
import { ReelsRequiredHint }    from './reels-required-hint'

export function CreateLobbySection() {
    const [open, setOpen] = useState(false)
    const { createLobby, isPending, error } = useCreateLobby()
    const { hasReels } = useLocalReels()
    const t = useTranslations('home')
    const tCommon = useTranslations('common')

    /* ── Collapsed ── */
    if (!open) {
        return (
            <div className="flex flex-col gap-2">
                <Button size="lg" fullWidth disabled={!hasReels} onClick={() => setOpen(true)}>
                    {t('createLobby')}
                </Button>
                {!hasReels && <ReelsRequiredHint />}
            </div>
        )
    }

    /* ── Expanded ── */
    return (
        <div className="card-brutal overflow-hidden">
            <div className="h-[3px] bg-[var(--color-accent)] w-full" aria-hidden />

            <div className="p-4 flex flex-col gap-4">

                <div className="flex items-center justify-between">
                    <span
                        className="font-display uppercase leading-none text-[var(--color-accent)]"
                        style={{
                            fontSize:      'var(--text-title-sm)',
                            letterSpacing: 'var(--tracking-display)',
                        }}
                    >
                        {t('createTitle')}
                    </span>
                    <button
                        className="modal-close"
                        onClick={() => setOpen(false)}
                        aria-label={tCommon('cancel')}
                    >
                        ✕
                    </button>
                </div>

                <p
                    className="font-sans text-[var(--color-subtle)] -mt-2 leading-snug"
                    style={{ fontSize: 'var(--text-body-sm)' }}
                >
                    {t('createDescription')}
                </p>

                <PlayerNameForm
                    onSubmit={createLobby}
                    isPending={isPending}
                />

                <ErrorMessage message={error} />
            </div>
        </div>
    )
}

