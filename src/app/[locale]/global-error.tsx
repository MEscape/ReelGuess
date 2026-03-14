'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => { Sentry.captureException(error) }, [error])

    return (
        <html lang="en" className="dark">
            <body style={{ fontFamily: 'sans-serif', background: '#07070a', color: '#f2f2f4', display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💥</div>
                <h1 style={{ fontSize: 'clamp(2rem,10vw,3.5rem)', fontWeight: 'bold', color: '#f5c800', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, marginBottom: '0.5rem' }}>
                    ReelGuess
                </h1>
                <p style={{ color: '#8e8e9a', marginBottom: '2rem', maxWidth: '24rem' }}>
                    Something went wrong. Our team has been notified.
                </p>
                <button
                    onClick={reset}
                    style={{ padding: '0.75rem 2rem', background: '#f5c800', color: '#07070a', border: '3px solid #07070a', boxShadow: '4px 4px 0px #07070a', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', textTransform: 'uppercase' }}
                >
                    Try Again
                </button>
            </body>
        </html>
    )
}

