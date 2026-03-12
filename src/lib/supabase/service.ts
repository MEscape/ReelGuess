import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client using the **service role key**.
 *
 * ⚠️  SERVER-SIDE ONLY — never import this in client components or any file
 *     that is bundled for the browser. The service role key bypasses ALL Row
 *     Level Security policies and must never be exposed to the client.
 *
 * Usage: ALL write operations (INSERT / UPDATE / DELETE) must use this client.
 * Read operations that run server-side may also use this client.
 *
 * The anon client (`@/lib/supabase/server`) is retained for:
 *   - Realtime subscriptions (browser-side, read-only, anon key is fine)
 *   - Any server-side read that intentionally respects RLS
 */
export function createServiceClient() {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url) throw new Error('[supabase/service] SUPABASE_URL is not set')
    if (!key) throw new Error('[supabase/service] SUPABASE_SERVICE_ROLE_KEY is not set')

    return createSupabaseClient(url, key, {
        auth: {
            // Service role clients must never persist sessions
            persistSession:    false,
            autoRefreshToken:  false,
            detectSessionInUrl: false,
        },
    })
}
