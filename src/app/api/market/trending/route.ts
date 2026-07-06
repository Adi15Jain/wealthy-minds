import { ok, fail, requireUser } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";
import { generateJsonArray, hasAiProvider } from "@/lib/ai-client";

/**
 * GET /api/market/trending
 * Returns currently popular Indian market assets via the shared Gemini client.
 */

interface TrendingAsset {
    symbol: string;
    name: string;
    type: string;
    cagr3y: number;
    cagr1y: number;
    volatility: string;
    consistency: number;
    drawdown: number;
    sector: string;
    riskLabel: string;
    highlight: string;
}

const PROMPT = `You are a professional Indian financial markets data system with access to the latest market data as of today.

Return a JSON array of exactly 6 currently popular and relevant Indian market assets that retail investors are actively researching or investing in. These should be REAL assets with ACCURATE, up-to-date performance data.

Requirements:
- Include 2 popular mutual funds (mix of flexi cap, mid cap, ELSS, or index funds — choose from real top-performing funds)
- Include 2 popular Indian stocks (mix of large-cap and mid-cap companies that are currently in the news or trending)
- Include 1 index fund or ETF tracking a major Indian index
- Include 1 government bond, debt fund, or fixed-income instrument

For EACH asset, provide ACCURATE real-world data:
{
  "symbol": "<NSE ticker for stocks, or AMC short code for mutual funds>",
  "name": "<Full official name as listed on exchanges or AMC>",
  "type": "Stock" | "Mutual Fund" | "Bond",
  "cagr3y": <accurate 3-year CAGR as a float, e.g. 18.4>,
  "cagr1y": <accurate 1-year return as a float>,
  "volatility": "Low" | "Medium" | "High",
  "consistency": <risk-adjusted Sharpe-equivalent score, integer 40-99>,
  "drawdown": <worst peak-to-trough drawdown in last 5 years as negative float, e.g. -18.2>,
  "sector": "<Primary business sector or fund category>",
  "riskLabel": "<one of: Conservative, Moderate, Aggressive>",
  "highlight": "<one compelling reason this asset is noteworthy right now, max 15 words>"
}

Use the most recently available market data. Be as accurate as possible — investors will use this to make real decisions.
Return ONLY the raw JSON array. No markdown, no explanation, no code fences.`;

export async function GET() {
    const userId = await requireUser();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required", 401);

    const limited = rateLimit(`market-trending:${userId}`, {
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
        const assets = await generateJsonArray<TrendingAsset>(PROMPT);
        return ok(assets, { cacheSeconds: 3600 });
    } catch (error) {
        console.error("Trending API error:", error);
        return fail("UPSTREAM_ERROR", "Failed to fetch trending assets.", 502);
    }
}
