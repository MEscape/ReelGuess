import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase browser client for use in Client Components and hooks.
 *
 * The `NEXT_PUBLIC_` variables are safe to expose to the browser — they grant
 * only the permissions defined by Row Level Security policies.
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
}