import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { fail, requireUser } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";

const MAX_QUERY_LENGTH = 100;
const GROWW_TIMEOUT_MS = 10_000;

interface GrowwEntity {
    id?: string;
    search_id?: string;
    title?: string;
    company_short_name?: string;
    entity_type?: string;
    nse_scrip_code?: string;
    bse_scrip_code?: string;
    scheme_code?: string;
    isin?: string;
    groww_contract_id?: string;
    matched_brands?: string;
}

interface GrowwSearchResponse {
    content?: GrowwEntity[];
}

// Consumers read `content`, not `data` — keep this envelope as-is.
function searchResults(
    content: unknown[],
    cacheSeconds?: number,
): NextResponse {
    const headers = new Headers();
    if (cacheSeconds) {
        headers.set(
            "Cache-Control",
            `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
        );
    }
    return NextResponse.json({ success: true, content }, { headers });
}

export async function GET(request: NextRequest) {
    const userId = await requireUser();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required", 401);

    const limited = rateLimit(`market-search:${userId}`, {
        limit: 30,
        windowMs: 60_000,
    });
    if (!limited.allowed) {
        return fail("RATE_LIMITED", "Too many requests. Please slow down.", 429, {
            retryAfterSeconds: limited.retryAfterSeconds,
        });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
        return searchResults([]);
    }
    if (query.length > MAX_QUERY_LENGTH) {
        return fail(
            "BAD_REQUEST",
            `Search query must be at most ${MAX_QUERY_LENGTH} characters.`,
            400,
        );
    }

    const growwSearchUrl = `https://groww.in/v1/api/search/v1/entity?q=${encodeURIComponent(query)}&size=8`;

    const headers: Record<string, string> = { Accept: "application/json" };
    if (env.GROWW_API_KEY) {
        headers["Authorization"] = `Bearer ${env.GROWW_API_KEY}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GROWW_TIMEOUT_MS);

    try {
        const response = await fetch(growwSearchUrl, {
            method: "GET",
            headers,
            signal: controller.signal,
        });

        if (!response.ok) {
            console.error(`Groww search returned status ${response.status}`);
            return fail("UPSTREAM_ERROR", "Failed to search market data.", 502);
        }

        const data = (await response.json()) as GrowwSearchResponse;

        const formattedResults = (data.content ?? []).map((item) => {
            let entityType: "Stock" | "Mutual Fund" | "Bond" = "Stock";
            if (item.entity_type === "Scheme") {
                entityType = "Mutual Fund";
            } else if (item.entity_type === "Bond") {
                entityType = "Bond";
            }

            const symbol =
                item.nse_scrip_code ||
                item.bse_scrip_code ||
                item.scheme_code ||
                item.isin ||
                item.groww_contract_id ||
                item.id;

            return {
                id: item.id || item.search_id,
                name: item.title || item.company_short_name,
                symbol,
                type: entityType,
                sector:
                    item.matched_brands ||
                    item.company_short_name ||
                    "Investment Instrument",
            };
        });

        return searchResults(formattedResults, 60);
    } catch (error) {
        console.error("Groww search error:", error);
        return fail("UPSTREAM_ERROR", "Failed to search market data.", 502);
    } finally {
        clearTimeout(timer);
    }
}
