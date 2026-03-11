import { createServerClient } from '@supabase/ssr'
import { cookies }            from 'next/headers'

/**
 * Creates a Supabase server client for use in Server Components,
 * Server Actions and Route Handlers.
 *
 * The returned client reads and writes auth cookies via the Next.js
 * `cookies()` store to keep the session synchronised across requests.
 */
export async function createClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        )
                    } catch {
                        // Safe to ignore in read-only Server Component contexts
                    }
                },
            },
        },
    )
}