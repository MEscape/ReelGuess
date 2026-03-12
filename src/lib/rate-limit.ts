/**
 * Production-grade rate limiter with automatic Upstash Redis backend.
 *
 * ── Why Upstash? ──────────────────────────────────────────────────────────────
 * In-memory Maps reset on every Vercel cold start and offer zero protection
 * across concurrent serverless instances. Upstash Redis is:
 * - Edge-compatible (HTTP REST — no persistent TCP connections)
 * - Serverless-friendly (pay per request, generous free tier)
 * - Globally replicated (low latency everywhere)
 *
 * ── Graceful fallback ─────────────────────────────────────────────────────────
 * When UPSTASH_REDIS_REST_URL / TOKEN are absent (local dev, CI), the limiter
 * automatically falls back to an in-memory implementation so the app still
 * starts and all rate-limit checks pass (allow all in dev).
 *
 * ── Setup (production) ────────────────────────────────────────────────────────
 *   1. Create a free Upstash Redis database at https://upstash.com
 *   2. Add to Vercel environment variables:
 *        UPSTASH_REDIS_REST_URL=https://...
 *        UPSTASH_REDIS_REST_TOKEN=...
 *   3. These are already installed: @upstash/ratelimit @upstash/redis
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'

// ─────────────────────────────────────────────────────────────────────────────
// Action types & limits
// ─────────────────────────────────────────────────────────────────────────────

export type ActionType =
    | 'createLobby'
    | 'joinLobby'
    | 'startGame'
    | 'submitVote'
    | 'importReels'
    | 'startRound'
    | 'revealRound'
    | 'completeRound'
    | 'submitReaction'

/**
 * Per-action limits using sliding window strategy.
 *
 * | Action       | Window | Max | Rationale                                    |
 * |--------------|--------|-----|----------------------------------------------|
 * | createLobby  | 10 min | 3   | Prevent lobby-spam / DB bloat                |
 * | joinLobby    | 1 min  | 10  | Allow retries; block brute-force code guessing|
 * | startGame    | 1 min  | 5   | Host-only; prevents re-trigger spam          |
 * | submitVote   | 1 min  | 20  | 1 vote/round + generous retry budget         |
 * | importReels  | 1 hour | 5   | File processing is expensive                 |
 * | startRound   | 1 min  | 20  | Host-only; prevents rapid-start abuse        |
 * | revealRound  | 1 min  | 20  | Host-only; prevents rapid-reveal abuse       |
 * | completeRound| 1 min  | 20  | Host-only; prevents rapid-complete abuse     |
 */
const LIMITS: Record<ActionType, { window: `${number} ${'s' | 'm' | 'h' | 'd'}`; limit: number }> = {
    createLobby:     { window: '10 m', limit: 3  },
    joinLobby:       { window: '1 m',  limit: 10 },
    startGame:       { window: '1 m',  limit: 5  },
    submitVote:      { window: '1 m',  limit: 20 },
    importReels:     { window: '1 h',  limit: 5  },
    startRound:      { window: '1 m',  limit: 20 },
    revealRound:     { window: '1 m',  limit: 20 },
    completeRound:   { window: '1 m',  limit: 20 },
    submitReaction:  { window: '10 s', limit: 10 },
}

// ─────────────────────────────────────────────────────────────────────────────
// Result type
// ─────────────────────────────────────────────────────────────────────────────

export type RateLimitResult = {
    success:   boolean
    remaining: number
    reset:     number
    headers:   Record<string, string>
}

// ─────────────────────────────────────────────────────────────────────────────
// Dev bypass — set RATE_LIMIT_DISABLED=true in .env.local to skip all checks
// ─────────────────────────────────────────────────────────────────────────────

const BYPASS_RESULT: RateLimitResult = {
    success:   true,
    remaining: 999,
    reset:     0,
    headers:   {},
}

function isDisabled(): boolean {
    return process.env.RATE_LIMIT_DISABLED === 'true'
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory fallback (dev / CI — no Upstash configured)
// ─────────────────────────────────────────────────────────────────────────────

type MemEntry = { count: number; resetAt: number }
const memStore = new Map<string, MemEntry>()

function memoryRateLimit(action: ActionType, identifier: string): RateLimitResult {
    const cfg = LIMITS[action]
    const windowMs = parseWindowMs(cfg.window)
    const key  = `${action}:${identifier}`
    const now  = Date.now()
    const entry = memStore.get(key)

    if (!entry || now > entry.resetAt) {
        memStore.set(key, { count: 1, resetAt: now + windowMs })
        return { success: true, remaining: cfg.limit - 1, reset: now + windowMs, headers: {} }
    }
    if (entry.count >= cfg.limit) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
        return {
            success: false,
            remaining: 0,
            reset: entry.resetAt,
            headers: { 'Retry-After': String(retryAfter) },
        }
    }
    entry.count++
    return { success: true, remaining: cfg.limit - entry.count, reset: entry.resetAt, headers: {} }
}

function parseWindowMs(window: string): number {
    const [n, unit] = window.split(' ')
    const num = parseInt(n, 10)
    switch (unit) {
        case 's': return num * 1000
        case 'm': return num * 60 * 1000
        case 'h': return num * 60 * 60 * 1000
        case 'd': return num * 24 * 60 * 60 * 1000
        default:  return 60 * 1000
    }
}

// Clean up in long-lived processes — no-op in serverless (process exits per request)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [k, v] of memStore) {
            if (now > v.resetAt) memStore.delete(k)
        }
    }, 5 * 60 * 1000).unref?.()
}

// ─────────────────────────────────────────────────────────────────────────────
// Upstash limiter factory (lazily created per action)
// ─────────────────────────────────────────────────────────────────────────────

let _redis: Redis | null = null

function getRedis(): Redis | null {
    if (_redis) return _redis
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
    _redis = new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    return _redis
}

const limiterCache = new Map<ActionType, Ratelimit>()

function getLimiter(action: ActionType): Ratelimit | null {
    const redis = getRedis()
    if (!redis) return null

    if (limiterCache.has(action)) return limiterCache.get(action)!

    const cfg = LIMITS[action]
    const limiter = new Ratelimit({
        redis,
        limiter:   Ratelimit.slidingWindow(cfg.limit, cfg.window),
        prefix:    `reelguess:${action}`,
        analytics: false, // Disable analytics to reduce Redis writes / cost
    })
    limiterCache.set(action, limiter)
    return limiter
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
/**
 * Checks and records a rate-limit hit for a given action + identifier.
 *
 * - `RATE_LIMIT_DISABLED=true` in env  → always allow (local dev).
 * - In production (Upstash configured) → Redis sliding window.
 * - In development (no Upstash env)    → in-memory fallback (allows all).
 *
 * @param action     - The action type (must be in {@link LIMITS}).
 * @param identifier - Unique key for the caller (IP, playerId, sessionId).
 */
export async function checkRateLimit(
    action: ActionType,
    identifier: string,
): Promise<RateLimitResult> {
    if (isDisabled()) return BYPASS_RESULT

    const limiter = getLimiter(action)

    // No Upstash configured → in-memory fallback
    if (!limiter) return memoryRateLimit(action, identifier)

    try {
        const { success, limit, remaining, reset } = await limiter.limit(identifier)

        const headers: Record<string, string> = {
            'X-RateLimit-Limit':     String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset':     String(reset),
        }
        if (!success) headers['Retry-After'] = String(Math.ceil((reset - Date.now()) / 1000))

        return { success, remaining, reset, headers }
    } catch (e) {
        // If Redis is unreachable, fail open (allow the request) and log.
        // Failing closed would block all users if Upstash is down.
        console.warn('[rate-limit] Redis unreachable, failing open:', e)
        return { success: true, remaining: 1, reset: Date.now() + 60_000, headers: {} }
    }
}

/**
 * Convenience helper for Server Actions (no NextRequest available).
 * Reads IP from Next.js request headers.
 *
 * @param action           - Action type.
 * @param customIdentifier - Override IP with e.g. playerId for tighter scoping.
 */
export async function rateLimitFromIP(
    action: ActionType,
    customIdentifier?: string,
): Promise<RateLimitResult> {
    const { headers } = await import('next/headers')
    const h = await headers()
    const ip =
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip')                              ??
        'unknown'

    return checkRateLimit(action, customIdentifier ?? ip)
}
