'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button }    from '@/components/ui'

type NotMemberScreenProps = {
    emoji?:       string
    title:        string
    description:  string
}

export function NotMemberScreen({ emoji = '🔒', title, description }: NotMemberScreenProps) {
    const router = useRouter()
    const t = useTranslations('common')

    return (
        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-safe">
            <div className="w-full max-w-sm flex flex-col gap-0">

                <div
                    className="flex flex-col items-center gap-3 py-10 px-6 text-center"
                    style={{
                        background:  'var(--color-surface)',
                        border:      '2px solid var(--color-border-subtle)',
                        borderTop:   '4px solid var(--color-danger)',
                        boxShadow:   'var(--shadow-brutal)',
                    }}
                >
                    <span style={{ fontSize: '3.5rem', lineHeight: 1 }} aria-hidden>{emoji}</span>

                    <p
                        className="font-display uppercase"
                        style={{ fontSize: 'var(--text-title)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-accent)', lineHeight: 1 }}
                    >
                        {title}
                    </p>

                    <p
                        className="font-sans leading-relaxed"
                        style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)', maxWidth: '20rem' }}
                    >
                        {description}
                    </p>
                </div>

                <div
                    style={{ padding: '1rem', border: '2px solid var(--color-border-subtle)', borderTop: 'none', boxShadow: 'var(--shadow-brutal)' }}
                >
                    <Button size="lg" fullWidth onClick={() => router.push('/')}>
                        {t('home')}
                    </Button>
                </div>
            </div>
        </main>
    )
}

