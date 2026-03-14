/**
 * Shown below disabled Create/Join buttons when no reels are imported.
 *
 * A subtle hint with a warning arrow — guides users to import reels first.
 */
export function ReelsRequiredHint() {
    return (
        <p
            className="flex items-center justify-center gap-1.5 font-sans text-[var(--color-subtle)]"
            style={{ fontSize: 'var(--text-body-sm)' }}
        >
            <span className="text-[var(--color-warning)]" aria-hidden>↓</span>
            Import your Reels below first
        </p>
    )
}

