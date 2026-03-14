import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function NotFoundPage() {
    const t = useTranslations('notFound')

    return (
        <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 pb-safe">

            <header className="w-full max-w-sm text-center mb-8">
                <p
                    className="font-display text-[var(--color-border-strong)] leading-none mb-2"
                    style={{
                        fontSize:      'var(--text-display-lg)',
                        letterSpacing: 'var(--tracking-display)',
                    }}
                    aria-hidden="true"
                >
                    404
                </p>

                <h1
                    className="font-display uppercase leading-none text-[var(--color-accent)]"
                    style={{
                        fontSize:      'clamp(3rem, 14vw, 4.5rem)',
                        letterSpacing: 'var(--tracking-display)',
                        textShadow: [
                            '0 0 15px rgba(245,200,0,0.45)',
                            '0 0 40px rgba(245,200,0,0.22)',
                        ].join(', '),
                    }}
                >
                    {t('title')}
                </h1>

                <p
                    className="input-label mt-3"
                    style={{ color: 'var(--color-muted)' }}
                >
                    {t('subtitle')}
                </p>
            </header>

            <div className="w-full max-w-sm">
                <div className="card-brutal p-6 flex flex-col gap-5">
                    <p
                        className="font-sans text-[var(--color-muted)] leading-relaxed text-center"
                        style={{ fontSize: 'var(--text-body)' }}
                    >
                        {t('description')}
                    </p>

                    <Link href="/" className="btn btn-primary btn-lg w-full">
                        {t('goHome')}
                    </Link>
                </div>
            </div>

        </main>
    )
}

