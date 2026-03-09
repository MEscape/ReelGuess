export default function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-zinc-950">
      {children}
    </div>
  )
}

