import { ok, fail, requireUser } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";
import { generateJsonArray, hasAiProvider } from "@/lib/ai-client";

/**
 * GET /api/market/indices
 * Fetches Indian market index data via the shared Gemini client.
 */

interface MarketIndex {
    name: string;
    value: number;
    change: number;
    changePercent: number;
    trend: string;
    weekHigh: number;
    weekLow: number;
}

const PROMPT = `You are a real-time Indian stock market data system. Return a JSON array of the 4 major Indian market indices with their current approximate values and today's change.

Include these indices in this order:
1. NIFTY 50
2. SENSEX (BSE 30)
3. NIFTY BANK
4. NIFTY MIDCAP 150

For each index, return:
{
  "name": "<Index name>",
  "value": <current approximate value as float>,
  "change": <today's point change as float, positive or negative>,
  "changePercent": <today's percentage change as float>,
  "trend": "<up or down>",
  "weekHigh": <52-week high as float>,
  "weekLow": <52-week low as float>
}

Use the most recent available data. Be as accurate as possible with current values.
Return ONLY the raw JSON array.`;

export async function GET() {
    const userId = await requireUser();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required", 401);

    const limited = rateLimit(`market-indices:${userId}`, {
        limit: 10,
        windowMs: 60_000,
    });
    if (!limited.allowed) {
        return fail("RATE_LIMITED", "Too many requests. Please slow down.", 429, {
            retryAfterSeconds: limited.retryAfterSeconds,
        });
    }

    if (!hasAiProvider()) {
        return fail("AI_UNAVAILABLE", "Market data service is not configured.", 503);
    }

    try {
        const indices = await generateJsonArray<MarketIndex>(PROMPT);
        return ok(indices, { cacheSeconds: 300 });
    } catch (error) {
        console.error("Indices API error:", error);
        return fail("UPSTREAM_ERROR", "Failed to fetch market indices.", 502);
    }
}
