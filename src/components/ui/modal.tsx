'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ModalProps = {
    open:       boolean
    onClose?:   () => void
    title:      string
    /**
     * Optional subtitle rendered below the title in muted color.
     * Use for destructive confirmations ("This cannot be undone.") or context.
     */
    subtitle?:  string
    children:   ReactNode
    /**
     * Sticky footer row — typically contains action buttons.
     * Renders right-aligned by default.
     */
    footer?:    ReactNode
    className?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Brutalist modal dialog.
 *
 * Improvements over previous version:
 *  - Accent stripe at the top of the box (visual brand anchor).
 *  - `subtitle` prop for confirmation context below the title.
 *  - Close button is now 36×36px with danger-bg hover state — larger hit area.
 *  - Modal box gets `max-h` + overflow scroll so tall content never clips viewport.
 *  - Focus is moved to the close button on open for keyboard users.
 *
 * @example
 * ```tsx
 * <Modal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Leave Game?"
 *   subtitle="You will lose your current streak and points."
 *   footer={
 *     <>
 *       <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button variant="danger" size="sm" onClick={handleLeave}>Leave</Button>
 *     </>
 *   }
 * >
 *   <p className="text-[var(--color-muted)]">
 *     Your score won't be saved for this round.
 *   </p>
 * </Modal>
 * ```
 */
export function Modal({
                          open,
                          onClose,
                          title,
                          subtitle,
                          children,
                          footer,
                          className,
                      }: ModalProps) {
    const closeRef = useRef<HTMLButtonElement>(null)

    // Move focus to close button when modal opens
    useEffect(() => {
        if (open) {
            // Defer one frame so the animation has started
            const raf = requestAnimationFrame(() => closeRef.current?.focus())
            return () => cancelAnimationFrame(raf)
        }
    }, [open])

    // Close on Escape
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    if (!open) return null

    return (
        <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div
                className={cn('modal-box', className)}
                role="dialog"
                aria-modal
                aria-labelledby="modal-title"
                aria-describedby={subtitle ? 'modal-subtitle' : undefined}
            >
                {/* ── Header ───────────────────────────────────────── */}
                <div className="flex items-start justify-between gap-4 px-6 py-5 border-b-2 border-[var(--color-border)]">
                    <div className="flex flex-col gap-1 min-w-0">
                        <h2
                            id="modal-title"
                            className="font-display uppercase tracking-widest leading-none"
                            style={{ fontSize: 'var(--text-title)' }}
                        >
                            {title}
                        </h2>
                        {subtitle && (
                            <p
                                id="modal-subtitle"
                                className="font-sans text-[var(--color-muted)] leading-snug"
                                style={{ fontSize: 'var(--text-body-sm)' }}
                            >
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <button
                        ref={closeRef}
                        className="modal-close shrink-0 mt-0.5"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* ── Body ─────────────────────────────────────────── */}
                <div
                    className="px-6 py-6 overflow-y-auto"
                    style={{ maxHeight: 'calc(80dvh - 10rem)' }}
                >
                    {children}
                </div>

                {/* ── Footer ───────────────────────────────────────── */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t-2 border-[var(--color-border)]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}