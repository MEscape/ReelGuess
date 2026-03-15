'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { StatusPanel } from '@/components/ui/status-panel'
import { Badge } from '@/components/ui/badge'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type NavItem = {
    label:  string
    href:   string
    /** Optional badge count — e.g. unread chat or player count. */
    count?: number
}

type NavBarProps = {
    /** Current active path — from Next.js `usePathname()`. */
    activePath?: string
    /** Override the default nav items. */
    items?: NavItem[]
    /**
     * Live round label shown on the right.
     * Hidden when undefined.
     */
    roundLabel?: string
    className?: string
}

const DEFAULT_ITEMS: NavItem[] = [
    { label: 'Lobby',    href: '/lobby'    },
    { label: 'Game',     href: '/game'     },
    { label: 'Scores',   href: '/scores'   },
    { label: 'Settings', href: '/settings' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Top navigation bar — sticky, full-width.
 *
 * Improvements over previous version:
 *  - Left edge has a 3px accent border (visual grounding on dark bg).
 *  - Logo uses two weights: accent "Quiz" + bold white "Smash", clearly larger
 *    than nav items so hierarchy is unambiguous.
 *  - Nav items carry optional `count` badge for player/notification counts.
 *  - `roundLabel` renders as a `StatusPanel` with live dot, stays right-aligned.
 *  - Divider between logo and nav items is more visible (border-strong).
 *
 * Usage:
 * ```tsx
 * 'use client'
 * import { usePathname } from 'next/navigation'
 *
 * export function AppNavBar() {
 *   const path = usePathname()
 *   return <NavBar activePath={path} roundLabel="Round 3 / 5" />
 * }
 * ```
 */
export function NavBar({
                           activePath,
                           items      = DEFAULT_ITEMS,
                           roundLabel,
                           className,
                       }: NavBarProps) {
    return (
        <nav
            className={cn(
                'sticky top-0 z-50 flex items-center gap-5 px-5',
                'bg-[var(--color-background)]',
                // Bottom separator — 2px strong border
                'border-b-2 border-[var(--color-border-subtle)]',
                // Left accent stripe — brand anchor
                'border-l-[3px] border-l-[var(--color-accent)]',
                className,
            )}
            style={{ height: 'var(--height-nav)' }}
        >
            {/* ── Logo ─────────────────────────────────────────────── */}
            <Link
                href="/"
                className="no-underline shrink-0 leading-none"
                aria-label="ReelGuess home"
            >
                <span
                    className="font-display uppercase leading-none"
                    style={{
                        fontSize:      'var(--text-title-sm)',
                        letterSpacing: 'var(--tracking-display)',
                    }}
                >
                    <span className="text-[var(--color-foreground)]">Reel</span>
                    <span className="text-[var(--color-accent)]">Guess</span>
                </span>
            </Link>

            {/* ── Vertical divider ─────────────────────────────────── */}
            <span
                className="shrink-0 self-stretch my-2.5"
                style={{
                    width:           '2px',
                    backgroundColor: 'var(--color-border-strong)',
                }}
                aria-hidden
            />

            {/* ── Nav items ────────────────────────────────────────── */}
            <ul className="flex items-center gap-4 list-none m-0 p-0">
                {items.map(({ label, href, count }) => {
                    const isActive = activePath?.startsWith(href)
                    return (
                        <li key={href} className="flex items-center gap-1.5">
                            <Link
                                href={href}
                                className={cn(
                                    'nav-item',
                                    isActive && 'active',
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {label}
                            </Link>
                            {count !== undefined && count > 0 && (
                                <Badge variant="muted" size="sm">
                                    {count}
                                </Badge>
                            )}
                        </li>
                    )
                })}
            </ul>

            {/* ── Push right ───────────────────────────────────────── */}
            <div className="flex-1" />

            {/* ── Live round status ────────────────────────────────── */}
            {roundLabel && (
                <StatusPanel status="live" label={roundLabel} />
            )}
        </nav>
    )
}