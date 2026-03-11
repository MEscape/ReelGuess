import React from "react";

export default function GameLayout({ children }: { children: React.ReactNode }) {
    return <div className="min-h-dvh bg-[var(--color-background)]">{children}</div>
}