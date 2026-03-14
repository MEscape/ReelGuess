'use client'

import { useState, useCallback }       from 'react'
import { useTranslations }             from 'next-intl'
import { Input, ErrorMessage, Button }  from '@/components/ui'
import { useJoinLobby }                 from '../hooks/use-lobby'
import { cn }                           from '@/lib/utils/cn'

export function JoinForm() {
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const { joinLobby, isPending, error } = useJoinLobby()
    const t = useTranslations('lobby')
    const tPlayer = useTranslations('player')
    const tAria = useTranslations('aria')

    const codeReady = code.length === 6
    const nameReady = name.trim().length >= 2
    const canSubmit = codeReady && nameReady && !isPending

    const hint = !codeReady
        ? `${6 - code.length} more character${6 - code.length !== 1 ? 's' : ''} needed`
        : !nameReady
            ? tPlayer('nameRequired')
            : null

    const handleSubmit = useCallback(() => {
        if (canSubmit) joinLobby(code, name.trim())
    }, [canSubmit, joinLobby, code, name])

    return (
        <div className="flex flex-col gap-4 w-full">

            {/* ── Code input ── */}
            <div className="flex flex-col gap-1.5">
                <label className="input-label">{t('code')}</label>
                <input
                    className={cn(
                        'input input-code',
                        codeReady && 'border-[var(--color-accent)]',
                    )}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                    placeholder="XXXXXX"
                    maxLength={6}
                    autoComplete="off"
                    spellCheck={false}
                    inputMode="text"
                    aria-label={tAria('lobbyCode', { code: 'XXXXXX' })}
                />
            </div>

            {/* ── Name input ── */}
            <Input
                label={tPlayer('nameLabel')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                placeholder={tPlayer('namePlaceholder')}
                maxLength={16}
                autoComplete="nickname"
            />

            {/* ── Field completion strip ── */}
            <div className="flex gap-1.5" aria-hidden>
                <div className={cn(
                    'h-[3px] flex-1 transition-colors duration-[var(--duration-base)]',
                    codeReady ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-subtle)]',
                )} />
                <div className={cn(
                    'h-[3px] flex-1 transition-colors duration-[var(--duration-base)]',
                    nameReady ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-subtle)]',
                )} />
            </div>

            {/* ── Submit ── */}
            <Button
                type="button"
                variant="secondary"
                size="lg"
                fullWidth
                loading={isPending}
                disabled={!canSubmit}
                onClick={handleSubmit}
            >
                🔗 {t('title')}
            </Button>

            {hint && !isPending && (
                <p
                    className="text-center font-sans text-[var(--color-subtle)]"
                    style={{ fontSize: 'var(--text-body-sm)' }}
                >
                    {hint}
                </p>
            )}

            <ErrorMessage message={error} />
        </div>
    )
}
