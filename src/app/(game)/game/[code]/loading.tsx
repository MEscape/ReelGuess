import { SkeletonBlock } from '@/components/ui'

/**
 * Skeleton loading state for the game page.
 * Matches the approximate shape of the voting phase layout.
 */
export default function GameLoading() {
    return (
        <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto px-4 py-4">
            {/* Round header */}
            <div className="flex items-center justify-between w-full">
                <SkeletonBlock className="h-8 w-32" />
                <SkeletonBlock className="w-16 h-16 rounded-full" />
            </div>
            {/* Reel placeholder */}
            <SkeletonBlock className="w-full max-w-sm h-[560px] rounded-2xl" />
            {/* Voting grid */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
                {[0, 1, 2, 3].map((i) => (
                    <SkeletonBlock key={i} className="h-24 rounded-2xl" />
                ))}
            </div>
        </div>
    )
}
