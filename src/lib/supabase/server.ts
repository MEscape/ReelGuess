import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase server client using the **service role key**.
 *
 * Used in Server Components, Server Actions and Route Handlers for all
 * database reads and writes. Bypasses Row Level Security — this is intentional
 * since all access control is enforced at the action layer (input validation,
 * host-only guards, rate limiting), not at the DB policy layer.
 *
 * ⚠️  SERVER-SIDE ONLY — never import this in client components or any file
 *     bundled for the browser. The service role key must never be exposed.
 *
 * `SUPABASE_URL` falls back to `NEXT_PUBLIC_SUPABASE_URL` so a single env var
 * works in both local dev (only NEXT_PUBLIC_ vars set) and production.
 */
export function createClient() {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url) throw new Error('[supabase/server] SUPABASE_URL is not set')
    if (!key) throw new Error('[supabase/server] SUPABASE_SERVICE_ROLE_KEY is not set')

    return createSupabaseClient(url, key, {
        auth: {
            persistSession:     false,
            autoRefreshToken:   false,
            detectSessionInUrl: false,
        },
    })
}