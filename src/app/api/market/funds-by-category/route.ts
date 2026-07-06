import { NextRequest } from "next/server";
import { ok, fail, requireUser } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";
import { generateJsonArray, hasAiProvider } from "@/lib/ai-client";

/**
 * GET /api/market/funds-by-category
 * Returns top-performing mutual funds for a given category.
 */

// Must match CATEGORIES in src/app/dashboard/fund-explorer/page.tsx exactly.
const ALLOWED_CATEGORIES = [
    "Large Cap",
    "Mid Cap",
    "Small Cap",
    "Flexi Cap",
    "ELSS (Tax Saving)",
    "Index Fund",
    "Debt / Bond",
    "International",
] as const;

interface Fund {
    name: string;
    symbol: string;
    amc: string;
    cagr1y: number;
    cagr3y: number;
    cagr5y: number;
    expenseRatio: number;
    aum: string;
    riskLabel: string;
    rating: number;
    minSIP: number;
}

export async function GET(request: NextRequest) {
    const userId = await requireUser();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required", 401);

    const limited = rateLimit(`market-funds:${userId}`, {
        limit: 10,
        windowMs: 60_000,
    });
    if (!limited.allowed) {
        return fail("RATE_LIMITED", "Too many requests. Please slow down.", 429, {
            retryAfterSeconds: limited.retryAfterSeconds,
        });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? "Large Cap";

    if (!(ALLOWED_CATEGORIES as readonly string[]).includes(category)) {
        return fail("BAD_REQUEST", "Unknown fund category.", 400);
    }

    if (!hasAiProvider()) {
        return fail("AI_UNAVAILABLE", "Fund data service is not configured.", 503);
    }

    const prompt = `You are a professional Indian mutual fund data system. Return a JSON array of the top 5 best-performing mutual funds in the "${category}" category in India.

For each fund, provide ACCURATE, real-world performance data:
{
  "name": "<Full official scheme name — direct growth plan>",
  "symbol": "<AMC short code or scheme code>",
  "amc": "<Asset Management Company name>",
  "cagr1y": <accurate 1-year return as float>,
  "cagr3y": <accurate 3-year CAGR as float>,
  "cagr5y": <accurate 5-year CAGR as float>,
  "expenseRatio": <expense ratio as float, e.g. 0.35>,
  "aum": "<AUM in crores, e.g. ₹42,500 Cr>",
  "riskLabel": "<Conservative | Moderate | Aggressive>",
  "rating": <Morningstar-style rating 1-5>,
  "minSIP": <minimum SIP amount in INR, e.g. 500>
}

Use the most recent available data. Only include direct growth plans.
Return ONLY the raw JSON array.`;

    try {
        const funds = await generateJsonArray<Fund>(prompt);
        return ok(funds, { cacheSeconds: 3600 });
    } catch (error) {
        console.error("Funds by category API error:", error);
        return fail("UPSTREAM_ERROR", "Failed to fetch funds.", 502);
    }
}
