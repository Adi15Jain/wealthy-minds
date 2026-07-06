/**
 * In-memory sliding-window rate limiter.
 *
 * Per-instance only: counters live in this process's memory, so limits apply
 * per server instance. Adequate for single-instance deploys; swap for a
 * Redis-backed limiter when running multiple instances.
 */

export interface RateLimitOptions {
    limit: number;
    windowMs: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}

const MAX_KEYS = 10_000;
const SWEEP_INTERVAL_MS = 60_000;

// key -> timestamps (ms) of requests inside the current window
const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

function sweep(now: number, windowMs: number): void {
    if (now - lastSweep < SWEEP_INTERVAL_MS) return;
    lastSweep = now;
    for (const [key, timestamps] of buckets) {
        const live = timestamps.filter((t) => t > now - windowMs);
        if (live.length === 0) {
            buckets.delete(key);
        } else {
            buckets.set(key, live);
        }
    }
}

export function rateLimit(
    key: string,
    { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
    const now = Date.now();
    sweep(now, windowMs);

    const cutoff = now - windowMs;
    const timestamps = (buckets.get(key) ?? []).filter((t) => t > cutoff);

    if (timestamps.length >= limit) {
        buckets.set(key, timestamps);
        const oldest = timestamps[0];
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.max(
                1,
                Math.ceil((oldest + windowMs - now) / 1000),
            ),
        };
    }

    timestamps.push(now);
    // Delete + re-set so Map insertion order tracks recency for eviction.
    buckets.delete(key);
    buckets.set(key, timestamps);

    if (buckets.size > MAX_KEYS) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey !== undefined) buckets.delete(oldestKey);
    }

    return {
        allowed: true,
        remaining: limit - timestamps.length,
        retryAfterSeconds: 0,
    };
}
