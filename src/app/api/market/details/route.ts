import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { ok, fail, requireUser } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";
import { generateJson, hasAiProvider } from "@/lib/ai-client";
import { fetchMfMetrics, isSchemeCode, type MfMetrics } from "@/lib/mf-data";

/**
 * GET /api/market/details
 * Comprehensive asset performance metrics.
 * - For Stocks: real fundamentals from Groww + AI analysis from Gemini
 * - For Mutual Funds/Bonds: AI analysis from Gemini
 */

const MAX_NAME_LENGTH = 200;
const MAX_TYPE_LENGTH = 50;
const MAX_SYMBOL_LENGTH = 100;
const MAX_ID_LENGTH = 200;
const GROWW_TIMEOUT_MS = 10_000;

interface GrowwStockResponse {
    header?: {
        industryName?: string;
        logoUrl?: string;
        nseScriptCode?: string;
        bseScriptCode?: string;
        displayName?: string;
        shortName?: string;
        isin?: string;
    };
    stats?: {
        marketCap?: number;
        peRatio?: number;
        pbRatio?: number;
        divYield?: number;
        dividendYieldInPercent?: number;
        roe?: number;
        returnOnEquity?: number;
        epsTtm?: number;
        debtToEquity?: number;
        cappedType?: string;
        operatingProfitMargin?: number;
        netProfitMargin?: number;
        currentRatio?: number;
        evToEbitda?: number;
    };
    priceData?: {
        nse?: { yearHighPrice?: number; yearLowPrice?: number };
        bse?: { yearHighPrice?: number; yearLowPrice?: number };
    };
}

interface GrowwMetrics {
    marketCap?: string;
    peRatio?: number;
    pbRatio?: number;
    dividendYield?: number;
    roe?: number;
    eps?: number;
    debtToEquity?: number;
    yearHigh?: number;
    yearLow?: number;
    cappedType?: string;
    industryName?: string;
    logoUrl?: string;
    nseSymbol?: string;
    bseSymbol?: string;
    displayName?: string;
    isin?: string;
    operatingMargin?: number;
    netProfitMargin?: number;
    currentRatio?: number;
    evToEbitda?: number;
}

interface GeminiAssetAnalysis {
    symbol: string;
    name: string;
    type: string;
    cagr3y: number;
    cagr5y: number;
    cagr1y: number;
    volatility: string;
    volatilityPercent: number;
    consistency: number;
    drawdown: number;
    sector: string;
    riskLabel: string;
    aiSummary: string;
    strengths: string[];
    risks: string[];
    recommendation: string;
    fairValueAssessment: string;
    sipSuitability: string;
}

async function fetchGrowwStockData(
    searchId: string,
): Promise<GrowwStockResponse | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GROWW_TIMEOUT_MS);
    try {
        const url = `https://groww.in/v1/api/stocks_data/v1/company/search_id/${encodeURIComponent(searchId)}`;
        const headers: Record<string, string> = { Accept: "application/json" };
        if (env.GROWW_API_KEY) {
            headers["Authorization"] = `Bearer ${env.GROWW_API_KEY}`;
        }
        const response = await fetch(url, {
            method: "GET",
            headers,
            signal: controller.signal,
        });
        if (!response.ok) return null;
        return (await response.json()) as GrowwStockResponse;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function extractGrowwMetrics(growwData: GrowwStockResponse): GrowwMetrics {
    const header = growwData.header ?? {};
    const stats = growwData.stats ?? {};
    const priceData = growwData.priceData?.nse ?? growwData.priceData?.bse ?? {};

    return {
        marketCap: stats.marketCap
            ? `₹${Number(stats.marketCap).toLocaleString("en-IN")} Cr`
            : undefined,
        peRatio: stats.peRatio ?? undefined,
        pbRatio: stats.pbRatio ?? undefined,
        dividendYield: stats.divYield ?? stats.dividendYieldInPercent ?? undefined,
        roe: stats.roe ?? stats.returnOnEquity ?? undefined,
        eps: stats.epsTtm ?? undefined,
        debtToEquity: stats.debtToEquity ?? undefined,
        yearHigh: priceData.yearHighPrice ?? undefined,
        yearLow: priceData.yearLowPrice ?? undefined,
        cappedType: stats.cappedType ?? undefined,
        industryName: header.industryName ?? undefined,
        logoUrl: header.logoUrl ?? undefined,
        nseSymbol: header.nseScriptCode ?? undefined,
        bseSymbol: header.bseScriptCode ?? undefined,
        displayName: header.displayName || header.shortName || undefined,
        isin: header.isin ?? undefined,
        operatingMargin: stats.operatingProfitMargin ?? undefined,
        netProfitMargin: stats.netProfitMargin ?? undefined,
        currentRatio: stats.currentRatio ?? undefined,
        evToEbitda: stats.evToEbitda ?? undefined,
    };
}

export async function GET(request: NextRequest) {
    const userId = await requireUser();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required", 401);

    const limited = rateLimit(`market-details:${userId}`, {
        limit: 10,
        windowMs: 60_000,
    });
    if (!limited.allowed) {
        return fail("RATE_LIMITED", "Too many requests. Please slow down.", 429, {
            retryAfterSeconds: limited.retryAfterSeconds,
        });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const type = searchParams.get("type");
    const symbol = searchParams.get("symbol");
    const id = searchParams.get("id");

    if (!name || !type) {
        return fail("BAD_REQUEST", "Name and Type are required.", 400);
    }
    if (
        name.length > MAX_NAME_LENGTH ||
        type.length > MAX_TYPE_LENGTH ||
        (symbol && symbol.length > MAX_SYMBOL_LENGTH) ||
        (id && id.length > MAX_ID_LENGTH)
    ) {
        return fail("BAD_REQUEST", "One or more parameters are too long.", 400);
    }

    // ── Step 1: Real data ───────────────────────────────────────────────
    // Stocks → Groww fundamentals. Mutual funds → AMFI NAV history (mfapi.in),
    // from which CAGR/volatility/drawdown are computed from the actual series.
    let growwMetrics: GrowwMetrics = {};
    const isStock = type === "Stock" || type === "Equity";
    const isMutualFund = type === "Mutual Fund" || type === "Fund";

    if (isStock && id) {
        const growwData = await fetchGrowwStockData(id);
        if (growwData) {
            growwMetrics = extractGrowwMetrics(growwData);
        }
    }
    const hasGrowwData = Object.keys(growwMetrics).length > 0;

    let mfMetrics: MfMetrics | null = null;
    if (isMutualFund && isSchemeCode(symbol)) {
        mfMetrics = await fetchMfMetrics(symbol as string);
    }

    // Real, computed metrics for mutual funds — the numbers we trust and never
    // let the model overwrite.
    const mfCore = mfMetrics
        ? {
              symbol: symbol || mfMetrics.schemeName,
              name: mfMetrics.schemeName || name,
              type,
              cagr3y: mfMetrics.cagr3y ?? 0,
              cagr5y: mfMetrics.cagr5y ?? 0,
              cagr1y: mfMetrics.cagr1y ?? 0,
              volatility: mfMetrics.volatilityLabel,
              volatilityPercent: mfMetrics.volatilityPercent,
              consistency: mfMetrics.consistency,
              drawdown: mfMetrics.maxDrawdownPercent,
              sector: mfMetrics.category,
              riskLabel: mfMetrics.riskLabel,
              latestNav: mfMetrics.latestNav,
              fundHouse: mfMetrics.fundHouse,
              dataSource: "AMFI NAV history",
          }
        : null;

    // ── Step 2: Gemini narrative ────────────────────────────────────────
    if (!hasAiProvider()) {
        if (mfCore) {
            // Real numbers, honest narrative — no model needed.
            return ok(
                {
                    ...mfCore,
                    aiSummary: `${mfCore.name} is a ${mfCore.sector} fund. Over the last 3 years it has delivered a ${mfCore.cagr3y}% CAGR with ${mfCore.volatilityPercent}% annualized volatility and a worst drawdown of ${mfCore.drawdown}%. Figures are computed from actual AMFI NAV history.`,
                    strengths: [],
                    risks: [],
                    recommendation:
                        "Detailed AI commentary is unavailable, but the performance figures above are real, computed from the fund's NAV history.",
                },
                { cacheSeconds: 600 },
            );
        }
        if (hasGrowwData) {
            // Graceful degradation: real fundamentals with placeholder analysis.
            return ok(
                {
                    symbol: growwMetrics.nseSymbol || symbol || "UNKNOWN",
                    name: growwMetrics.displayName || name,
                    type,
                    cagr3y: 0,
                    cagr5y: 0,
                    cagr1y: 0,
                    volatility: "Medium" as const,
                    consistency: 70,
                    drawdown: -15,
                    sector: growwMetrics.industryName || "Unknown",
                    ...growwMetrics,
                    aiSummary: "AI analysis unavailable.",
                    strengths: [],
                    risks: [],
                    recommendation: "AI analysis is currently unavailable.",
                },
                { cacheSeconds: 600 },
            );
        }
        return fail(
            "AI_UNAVAILABLE",
            "AI analysis is not available for this asset type.",
            503,
        );
    }

    let growwContext = "";
    if (mfCore) {
        growwContext = `
IMPORTANT — these are REAL metrics computed from the fund's actual AMFI NAV history. Do NOT contradict them; build your qualitative analysis around them:
- Category: ${mfCore.sector}
- 1Y return: ${mfCore.cagr1y}%
- 3Y CAGR: ${mfCore.cagr3y}%
- 5Y CAGR: ${mfCore.cagr5y}%
- Annualized volatility: ${mfCore.volatilityPercent}%
- Max drawdown: ${mfCore.drawdown}%
- Latest NAV: ₹${mfCore.latestNav}`;
    }
    if (hasGrowwData) {
        growwContext = `
IMPORTANT — Use these REAL, LIVE market fundamentals to calibrate your analysis:
- Market Cap: ${growwMetrics.marketCap || "N/A"}
- P/E Ratio (TTM): ${growwMetrics.peRatio || "N/A"}
- P/B Ratio: ${growwMetrics.pbRatio || "N/A"}
- ROE: ${growwMetrics.roe || "N/A"}%
- EPS (TTM): ₹${growwMetrics.eps || "N/A"}
- Debt/Equity: ${growwMetrics.debtToEquity || "N/A"}
- Dividend Yield: ${growwMetrics.dividendYield || "N/A"}%
- 52-Week High: ₹${growwMetrics.yearHigh || "N/A"}
- 52-Week Low: ₹${growwMetrics.yearLow || "N/A"}
- Cap Category: ${growwMetrics.cappedType || "N/A"}
- Industry: ${growwMetrics.industryName || "N/A"}
- Operating Margin: ${growwMetrics.operatingMargin ? growwMetrics.operatingMargin.toFixed(1) + "%" : "N/A"}
- Net Profit Margin: ${growwMetrics.netProfitMargin ? growwMetrics.netProfitMargin.toFixed(1) + "%" : "N/A"}
- Current Ratio: ${growwMetrics.currentRatio || "N/A"}
- EV/EBITDA: ${growwMetrics.evToEbitda || "N/A"}

These are verified live numbers — your CAGR, volatility, and drawdown estimates must be consistent with them.`;
    }

    const prompt = `You are a professional financial data and analysis system with access to real-time Indian market data.

Analyze this asset: "${name}" (Type: ${type}, Symbol: ${symbol || "N/A"}, Groww ID: ${id || "N/A"})
${growwContext}

Return a JSON object with comprehensive, ACCURATE performance metrics and investment analysis:
{
  "symbol": "${growwMetrics.nseSymbol || symbol || "UNKNOWN"}",
  "name": "${growwMetrics.displayName || name}",
  "type": "${type}",
  "cagr3y": <accurate 3-year CAGR percentage as float>,
  "cagr5y": <accurate 5-year CAGR percentage as float>,
  "cagr1y": <accurate trailing 1-year return percentage as float>,
  "volatility": "<exactly one of: Low, Medium, High>",
  "volatilityPercent": <annual standard deviation of returns as float, e.g. 18.5>,
  "consistency": <Sharpe-equivalent risk-adjusted stability score, integer 40-99>,
  "drawdown": <maximum peak-to-trough drop over last 5 years, negative float>,
  "sector": "<exact primary sector or fund category>",
  "riskLabel": "<one of: Conservative, Moderate, Aggressive>",
  "aiSummary": "<3-4 sentence professional analysis covering growth quality, risk profile, and investment suitability for long-term SIP>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "risks": ["<specific risk 1>", "<specific risk 2>", "<specific risk 3>"],
  "recommendation": "<2-3 sentence specific investment recommendation for a long-term SIP investor. Be direct and actionable.>",
  "fairValueAssessment": "<one of: Undervalued, Fairly Valued, Overvalued, based on fundamentals>",
  "sipSuitability": "<one of: Excellent, Good, Average, Poor — how suitable is this for monthly SIP>"
}

IMPORTANT RULES:
- Be HIGHLY ACCURATE with CAGR numbers. Cross-reference with known public data.
- For mutual funds, use direct plan growth option returns.
- Volatility, drawdown, and CAGR must be internally consistent.
- The aiSummary, strengths, risks, and recommendation must be genuinely insightful — not generic boilerplate.`;

    try {
        const parsedData = await generateJson<GeminiAssetAnalysis>(prompt);

        // Merge order matters: start with the model's output (mostly narrative),
        // then overlay REAL numbers — Groww fundamentals for stocks, and the
        // NAV-derived metrics for funds — so hard data always wins over
        // estimates. The model only ever contributes the qualitative fields.
        const enrichedData = {
            ...parsedData,
            ...(hasGrowwData ? growwMetrics : {}),
            ...(mfCore ?? {}),
            // Keep the model's qualitative analysis verbatim.
            aiSummary: parsedData.aiSummary,
            strengths: parsedData.strengths,
            risks: parsedData.risks,
            recommendation: parsedData.recommendation,
            fairValueAssessment: parsedData.fairValueAssessment,
            sipSuitability: parsedData.sipSuitability,
        };

        return ok(enrichedData, { cacheSeconds: 600 });
    } catch (error) {
        console.error("Details API error:", error);
        // If we already have real fund data, don't fail — return it without the
        // AI narrative rather than showing the user an error.
        if (mfCore) {
            return ok(
                {
                    ...mfCore,
                    aiSummary: `Performance figures are computed from ${mfCore.name}'s actual AMFI NAV history. AI commentary is temporarily unavailable.`,
                    strengths: [],
                    risks: [],
                    recommendation:
                        "The performance figures above are real; detailed AI commentary is temporarily unavailable.",
                },
                { cacheSeconds: 600 },
            );
        }
        return fail("UPSTREAM_ERROR", "Failed to fetch asset details.", 502);
    }
}
