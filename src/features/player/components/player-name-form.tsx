'use client'

import { useState, useCallback }  from 'react'
import { useTranslations }        from 'next-intl'
import { Input, Button }          from '@/components/ui'
import { NAME_MIN_LENGTH, NAME_MAX_LENGTH } from '../constants'

type PlayerNameFormProps = {
    onSubmit:     (name: string) => void
    isPending?:   boolean
    placeholder?: string
    buttonText?:  string
}

export function PlayerNameForm({
    onSubmit,
    isPending   = false,
    placeholder,
    buttonText,
}: PlayerNameFormProps) {
    const [name, setName] = useState('')
    const t = useTranslations('player')

    const trimmed   = name.trim()
    const canSubmit = trimmed.length >= NAME_MIN_LENGTH && !isPending
    const showError = trimmed.length > 0 && trimmed.length < NAME_MIN_LENGTH

    const resolvedPlaceholder = placeholder ?? t('namePlaceholder')
    const resolvedButtonText  = buttonText  ?? t('letsGo')

    const handleSubmit = useCallback(() => {
        if (canSubmit) onSubmit(trimmed)
    }, [canSubmit, onSubmit, trimmed])

    return (
        <div className="flex flex-col gap-3 w-full">
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                placeholder={resolvedPlaceholder}
                maxLength={NAME_MAX_LENGTH}
                aria-label={t('nameLabel')}
            />

            {showError && (
                <p
                    className="font-sans"
                    style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-danger)' }}
                >
                    {t('nameRequired')}
                </p>
            )}

            <Button
                type="button"
                size="md"
                fullWidth
                disabled={!canSubmit}
                loading={isPending}
                onClick={handleSubmit}
            >
                {resolvedButtonText}
            </Button>
        </div>
    )
}

