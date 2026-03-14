import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// OG Image Generator
//
// Generates a 1200×630 Open Graph image for social sharing.
// Usage: /api/og?locale=en|de
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = 'edge'

// Design tokens (inlined — CSS vars not available in ImageResponse)
const T = {
    bg:          '#07070a',
    surface:     '#111114',
    surfaceRaised: '#18181c',
    border:      '#222228',
    borderSubtle:'#2e2e36',
    borderStrong:'#44444f',
    accent:      '#f5c800',
    accentFg:    '#07070a',
    foreground:  '#f2f2f4',
    muted:       '#8e8e9a',
    subtle:      '#58586a',
} as const

const CONTENT: Record<string, { tagline: string; cta: string }> = {
    en: { tagline: 'Guess who liked the Reel',       cta: '🎬 Play for free' },
    de: { tagline: 'Rate, wer das Reel geliked hat', cta: '🎬 Kostenlos spielen' },
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
                    overflow:       'hidden',
                }}
            >
                {/* ── Grid texture overlay ── */}
                <div
                    style={{
                        position:   'absolute',
                        inset:      0,
                        backgroundImage:
                            `linear-gradient(${T.border} 1px, transparent 1px),
                             linear-gradient(90deg, ${T.border} 1px, transparent 1px)`,
                        backgroundSize: '48px 48px',
                        opacity:    0.4,
                        display:    'flex',
                    }}
                />

                {/* ── Accent glow blob (center) ── */}
                <div
                    style={{
                        position:     'absolute',
                        top:          '50%',
                        left:         '50%',
                        transform:    'translate(-50%, -50%)',
                        width:        '560px',
                        height:       '320px',
                        background:   'rgba(245,200,0,0.07)',
                        filter:       'blur(80px)',
                        borderRadius: '9999px',
                        display:      'flex',
                    }}
                />

                {/* ── Top accent bar ── */}
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

                {/* ── Bottom border ── */}
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

                {/* ── Corner marks (top-left, top-right, bottom-left, bottom-right) ── */}
                {[
                    { top: 28,    left: 28,   bottom: undefined, right: undefined },
                    { top: 28,    right: 28,  bottom: undefined, left: undefined  },
                    { bottom: 28, left: 28,   top: undefined,    right: undefined },
                    { bottom: 28, right: 28,  top: undefined,    left: undefined  },
                ].map((pos, i) => (
                    <div
                        key={i}
                        style={{
                            position:    'absolute',
                            width:       '20px',
                            height:      '20px',
                            borderTop:   pos.top    !== undefined ? `2px solid ${T.borderStrong}` : 'none',
                            borderBottom:pos.bottom !== undefined ? `2px solid ${T.borderStrong}` : 'none',
                            borderLeft:  pos.left   !== undefined ? `2px solid ${T.borderStrong}` : 'none',
                            borderRight: pos.right  !== undefined ? `2px solid ${T.borderStrong}` : 'none',
                            display:     'flex',
                            ...pos,
                        }}
                    />
                ))}

                {/* ── Main content ── */}
                <div
                    style={{
                        display:        'flex',
                        flexDirection:  'column',
                        alignItems:     'center',
                        gap:            '0px',
                        position:       'relative',
                        zIndex:         1,
                    }}
                >
                    {/* Label chip */}
                    <div
                        style={{
                            display:       'flex',
                            alignItems:    'center',
                            gap:           '8px',
                            padding:       '6px 16px',
                            background:    T.surface,
                            border:        `2px solid ${T.borderSubtle}`,
                            marginBottom:  '32px',
                        }}
                    >
                        <div style={{ display: 'flex', fontSize: '16px' }}>🎬</div>
                        <div
                            style={{
                                fontSize:      '13px',
                                fontWeight:    700,
                                color:         T.muted,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                display:       'flex',
                            }}
                        >
                            SOCIAL GAME
                        </div>
                    </div>

                    {/* Title */}
                    <div
                        style={{
                            fontSize:      '124px',
                            fontWeight:    900,
                            color:         T.accent,
                            letterSpacing: '-3px',
                            lineHeight:    '0.9',
                            textShadow:    `0 0 80px rgba(245,200,0,0.35)`,
                            display:       'flex',
                            marginBottom:  '8px',
                        }}
                    >
                        ReelGuess
                    </div>

                    {/* Subtitle line */}
                    <div
                        style={{
                            display:       'flex',
                            alignItems:    'center',
                            gap:           '16px',
                            marginBottom:  '48px',
                        }}
                    >
                        <div style={{ width: '40px', height: '2px', background: T.borderStrong, display: 'flex' }} />
                        <div
                            style={{
                                fontSize:      '18px',
                                color:         T.subtle,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                fontWeight:    600,
                                display:       'flex',
                            }}
                        >
                            {content.tagline}
                        </div>
                        <div style={{ width: '40px', height: '2px', background: T.borderStrong, display: 'flex' }} />
                    </div>

                    {/* CTA button — brutalist style */}
                    <div
                        style={{
                            display:       'flex',
                            padding:       '16px 48px',
                            background:    T.accent,
                            color:         T.accentFg,
                            fontSize:      '22px',
                            fontWeight:    900,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            border:        `3px solid ${T.accentFg}`,
                            boxShadow:     `6px 6px 0px ${T.accentFg}`,
                        }}
                    >
                        {content.cta}
                    </div>
                </div>
            </div>
        ),
        { width: 1200, height: 630 },
    )
}