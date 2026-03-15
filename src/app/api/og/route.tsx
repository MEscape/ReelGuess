import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

const T = {
    bg:           '#07070a',
    surface:      '#111114',
    border:       '#222228',
    borderSubtle: '#2e2e36',
    borderStrong: '#44444f',
    accent:       '#f5c800',
    accentFg:     '#07070a',
    muted:        '#8e8e9a',
    subtle:       '#58586a',
} as const

const CONTENT: Record<string, { tagline: string; cta: string }> = {
    en: { tagline: 'Guess who liked the Reel',       cta: 'Play for free' },
    de: { tagline: 'Rate, wer das Reel geliked hat', cta: 'Kostenlos spielen' },
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const locale  = searchParams.get('locale') ?? 'en'
    const content = CONTENT[locale] ?? CONTENT['en']

    return new ImageResponse(
        (
            <div
                style={{
                    display:        'flex',
                    flexDirection:  'column',
                    alignItems:     'center',
                    justifyContent: 'center',
                    width:          '100%',
                    height:         '100%',
                    background:     T.bg,
                    fontFamily:     'sans-serif',
                    position:       'relative',
                }}
            >
                {/* Grid overlay — single backgroundImage, no multi-line string */}
                <div
                    style={{
                        position:        'absolute',
                        top:             0,
                        left:            0,
                        right:           0,
                        bottom:          0,
                        backgroundImage: 'linear-gradient(#222228 1px, transparent 1px)',
                        backgroundSize:  '48px 48px',
                        opacity:         0.4,
                        display:         'flex',
                    }}
                />

                {/* Glow blob — radial gradient, no filter */}
                <div
                    style={{
                        position:     'absolute',
                        top:          '115px',
                        left:         '250px',
                        width:        '700px',
                        height:       '400px',
                        background:   'radial-gradient(ellipse at center, rgba(245,200,0,0.15) 0%, transparent 70%)',
                        borderRadius: '50%',
                        display:      'flex',
                    }}
                />

                {/* Top accent bar */}
                <div
                    style={{
                        position:   'absolute',
                        top:        0,
                        left:       0,
                        right:      0,
                        height:     '5px',
                        background: T.accent,
                        display:    'flex',
                    }}
                />

                {/* Bottom border */}
                <div
                    style={{
                        position:   'absolute',
                        bottom:     0,
                        left:       0,
                        right:      0,
                        height:     '2px',
                        background: T.borderStrong,
                        display:    'flex',
                    }}
                />

                {/* Corner marks */}
                <div style={{ position: 'absolute', top: 28, left: 28, width: 20, height: 20, borderTop: `2px solid ${T.borderStrong}`, borderLeft: `2px solid ${T.borderStrong}`, display: 'flex' }} />
                <div style={{ position: 'absolute', top: 28, right: 28, width: 20, height: 20, borderTop: `2px solid ${T.borderStrong}`, borderRight: `2px solid ${T.borderStrong}`, display: 'flex' }} />
                <div style={{ position: 'absolute', bottom: 28, left: 28, width: 20, height: 20, borderBottom: `2px solid ${T.borderStrong}`, borderLeft: `2px solid ${T.borderStrong}`, display: 'flex' }} />
                <div style={{ position: 'absolute', bottom: 28, right: 28, width: 20, height: 20, borderBottom: `2px solid ${T.borderStrong}`, borderRight: `2px solid ${T.borderStrong}`, display: 'flex' }} />

                {/* Main content */}
                <div
                    style={{
                        display:       'flex',
                        flexDirection: 'column',
                        alignItems:    'center',
                        position:      'relative',
                    }}
                >
                    {/* Label chip */}
                    <div
                        style={{
                            display:      'flex',
                            alignItems:   'center',
                            gap:          '8px',
                            padding:      '6px 16px',
                            background:   T.surface,
                            border:       `2px solid ${T.borderSubtle}`,
                            marginBottom: '32px',
                        }}
                    >
                        <div style={{ display: 'flex', fontSize: '16px' }}>🎬</div>
                        <div
                            style={{
                                fontSize:   '13px',
                                fontWeight: 700,
                                color:      T.muted,
                                display:    'flex',
                            }}
                        >
                            SOCIAL GAME
                        </div>
                    </div>

                    {/* Title */}
                    <div
                        style={{
                            fontSize:     '124px',
                            fontWeight:   900,
                            color:        T.accent,
                            lineHeight:   1,
                            display:      'flex',
                            marginBottom: '16px',
                        }}
                    >
                        ReelGuess
                    </div>

                    {/* Tagline row */}
                    <div
                        style={{
                            display:      'flex',
                            alignItems:   'center',
                            gap:          '16px',
                            marginBottom: '48px',
                        }}
                    >
                        <div style={{ width: '40px', height: '2px', background: T.borderStrong, display: 'flex' }} />
                        <div
                            style={{
                                fontSize:   '18px',
                                color:      T.subtle,
                                fontWeight: 600,
                                display:    'flex',
                            }}
                        >
                            {content.tagline}
                        </div>
                        <div style={{ width: '40px', height: '2px', background: T.borderStrong, display: 'flex' }} />
                    </div>

                    {/* CTA — offset shadow via sibling div, no boxShadow */}
                    <div style={{ display: 'flex', position: 'relative' }}>
                        <div
                            style={{
                                position:   'absolute',
                                top:        '6px',
                                left:       '6px',
                                width:      '100%',
                                height:     '100%',
                                background: T.accentFg,
                                display:    'flex',
                            }}
                        />
                        <div
                            style={{
                                display:    'flex',
                                padding:    '16px 48px',
                                background: T.accent,
                                color:      T.accentFg,
                                fontSize:   '22px',
                                fontWeight: 900,
                                border:     `3px solid ${T.accentFg}`,
                                position:   'relative',
                            }}
                        >
                            {content.cta}
                        </div>
                    </div>
                </div>
            </div>
        ),
        { width: 1200, height: 630 },
    )
}