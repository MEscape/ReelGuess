import { SkeletonBlock } from '@/components/ui'

export default function LobbyLoading() {
    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-4 py-8">
            <SkeletonBlock className="h-12 w-48" />
            <SkeletonBlock className="h-20 w-full rounded-2xl" />
            <div className="w-full flex flex-col gap-2">
                {[0, 1, 2].map((i) => <SkeletonBlock key={i} className="h-14 w-full rounded-xl" />)}
            </div>
        </div>
    )
}
