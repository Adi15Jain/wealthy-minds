import { NextRequest } from "next/server";
import { ok, fail, requireUser } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";
import { generateJson, hasAiProvider } from "@/lib/ai-client";

/**
 * POST /api/market/analyze
 * Deep AI comparative analysis. Accepts multiple assets with their metrics
 * and produces a comprehensive investment analysis report.
 */

const MAX_ASSETS = 5;
const MAX_TEXT_FIELD_LENGTH = 300;
const MAX_SUMMARY_LENGTH = 1000;

interface AnalyzeAsset {
    name: string;
    symbol: string;
    type: string;
    cagr3y: number;
    cagr5y?: number;
    cagr1y?: number;
    volatility: string;
    consistency: number;
    drawdown: number;
    sector: string;
    peRatio?: number;
    pbRatio?: number;
    roe?: number;
    marketCap?: string;
    debtToEquity?: number;
    aiSummary?: string;
}

interface AnalysisReport {
    verdict: string;
    ranking: Array<{
        rank: number;
        symbol: string;
        name: string;
        score: number;
        rationale: string;
    }>;
    deepAnalysis: {
        riskRewardMatrix: string;
        compoundingAdvantage: string;
        marketCycleResilience: string;
        sipOptimalStrategy: string;
    };
    projections: {
        bestCase: string;
        worstCase: string;
        recommendation: string;
    };
    keyInsights: string[];
    warnings: string[];
}

function asBoundedString(
    value: unknown,
    maxLength: number,
): string | undefined {
    return typeof value === "string" ? value.slice(0, maxLength) : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : undefined;
}

function parseAsset(raw: unknown): AnalyzeAsset | null {
    if (typeof raw !== "object" || raw === null) return null;
    const record = raw as Record<string, unknown>;

    const name = asBoundedString(record.name, MAX_TEXT_FIELD_LENGTH);
    const symbol = asBoundedString(record.symbol, MAX_TEXT_FIELD_LENGTH);
    if (!name || !symbol) return null;

    return {
        name,
        symbol,
        type: asBoundedString(record.type, 50) ?? "Unknown",
        cagr3y: asFiniteNumber(record.cagr3y) ?? 0,
        cagr5y: asFiniteNumber(record.cagr5y),
        cagr1y: asFiniteNumber(record.cagr1y),
        volatility: asBoundedString(record.volatility, 20) ?? "Medium",
        consistency: asFiniteNumber(record.consistency) ?? 0,
        drawdown: asFiniteNumber(record.drawdown) ?? 0,
        sector: asBoundedString(record.sector, MAX_TEXT_FIELD_LENGTH) ?? "Unknown",
        peRatio: asFiniteNumber(record.peRatio),
        pbRatio: asFiniteNumber(record.pbRatio),
        roe: asFiniteNumber(record.roe),
        marketCap: asBoundedString(record.marketCap, 50),
        debtToEquity: asFiniteNumber(record.debtToEquity),
        aiSummary: asBoundedString(record.aiSummary, MAX_SUMMARY_LENGTH),
    };
}

export async function POST(request: NextRequest) {
    const userId = await requireUser();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required", 401);

    const limited = rateLimit(`market-analyze:${userId}`, {
        limit: 10,
        windowMs: 60_000,
    });
    if (!limited.allowed) {
        return fail("RATE_LIMITED", "Too many requests. Please slow down.", 429, {
            retryAfterSeconds: limited.retryAfterSeconds,
        });
    }

    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
        return fail("BAD_REQUEST", "Request body must be JSON.", 400);
    }
    const record = body as Record<string, unknown>;

    if (!Array.isArray(record.assets) || record.assets.length === 0) {
        return fail(
            "BAD_REQUEST",
            "At least one asset is required for analysis.",
            400,
        );
    }
    if (record.assets.length > MAX_ASSETS) {
        return fail(
            "BAD_REQUEST",
            `At most ${MAX_ASSETS} assets can be analyzed at once.`,
            400,
        );
    }

    const assets: AnalyzeAsset[] = [];
    for (const rawAsset of record.assets) {
        const asset = parseAsset(rawAsset);
        if (!asset) {
            return fail("BAD_REQUEST", "One or more assets are malformed.", 400);
        }
        assets.push(asset);
    }

    const sipAmountValue = asFiniteNumber(record.sipAmount) ?? 10_000;
    const sipAmount = Math.min(Math.max(sipAmountValue, 100), 10_000_000);
    const yearsValue = asFiniteNumber(record.years) ?? 10;
    const investmentYears = Math.min(Math.max(Math.round(yearsValue), 1), 50);
    const stepUpValue = asFiniteNumber(record.stepUp);
    const stepUp =
        stepUpValue !== undefined && stepUpValue > 0
            ? Math.min(stepUpValue, 100)
            : undefined;

    if (!hasAiProvider()) {
        return fail("AI_UNAVAILABLE", "AI analysis is not configured.", 503);
    }

    const assetsDescription = assets
        .map((a, idx) => {
            const lines = [
                `${idx + 1}. **${a.name}** (${a.symbol}, ${a.type})`,
                `   - 3Y CAGR: ${a.cagr3y}%`,
            ];
            if (a.cagr5y) lines.push(`   - 5Y CAGR: ${a.cagr5y}%`);
            if (a.cagr1y) lines.push(`   - 1Y Return: ${a.cagr1y}%`);
            lines.push(
                `   - Volatility: ${a.volatility}, Consistency Score: ${a.consistency}/100`,
            );
            lines.push(`   - Max Drawdown: ${a.drawdown}%`);
            lines.push(`   - Sector: ${a.sector}`);
            if (a.peRatio) {
                lines.push(
                    `   - P/E: ${a.peRatio}, P/B: ${a.pbRatio ?? "N/A"}, ROE: ${a.roe ?? "N/A"}%`,
                );
            }
            if (a.marketCap) lines.push(`   - Market Cap: ${a.marketCap}`);
            if (a.debtToEquity) lines.push(`   - Debt/Equity: ${a.debtToEquity}`);
            if (a.aiSummary) lines.push(`   - Summary: ${a.aiSummary}`);
            return lines.join("\n");
        })
        .join("\n\n");

    const sipFormatted = sipAmount.toLocaleString("en-IN");

    const prompt = `You are WealthyMinds AI Teller — a premium, expert-level investment analyst specializing in Indian financial markets and long-term SIP (Systematic Investment Plan) strategies.

## Your Task
Provide a comprehensive, deeply analytical, and actionable comparative analysis for a disciplined Indian retail investor considering a **${investmentYears}-year SIP** with **₹${sipFormatted}/month**${stepUp ? ` and a **${stepUp}% yearly step-up**` : ""}.

## Assets Under Analysis
${assetsDescription}

## Required Output — JSON Format
Return a JSON object with this exact structure:
{
  "verdict": "<Clear, decisive 2-3 sentence recommendation. Name the specific asset(s) to choose and why. Be opinionated.>",
  "ranking": [
    {
      "rank": 1,
      "symbol": "<symbol>",
      "name": "<name>",
      "score": <overall investment quality score out of 100>,
      "rationale": "<2-3 sentences explaining this ranking position with specific metrics>"
    }
  ],
  "deepAnalysis": {
    "riskRewardMatrix": "<200-word paragraph comparing risk-reward tradeoffs across all assets with specific numbers>",
    "compoundingAdvantage": "<200-word paragraph on which asset compounds better over ${investmentYears} years, with projected SIP values>",
    "marketCycleResilience": "<150-word paragraph on how each asset handles bull/bear/sideways markets>",
    "sipOptimalStrategy": "<150-word paragraph with specific actionable advice: allocation percentages, entry strategy, rebalancing schedule>"
  },
  "projections": {
    "bestCase": "<Which asset gives best projected returns for a ₹${sipFormatted}/month SIP over ${investmentYears} years, with estimated total corpus>",
    "worstCase": "<Which asset has highest downside risk, with estimated floor value>",
    "recommendation": "<Final balanced recommendation for a conservative long-term investor, naming specific assets and allocation %>"
  },
  "keyInsights": [
    "<Insight 1: A specific, non-obvious finding from the data>",
    "<Insight 2: A counterintuitive observation>",
    "<Insight 3: A tactical timing or allocation insight>"
  ],
  "warnings": ["<Important caveat 1>", "<Important caveat 2>"]
}

## Rules
- Be specific, not generic. Use exact numbers, percentages, and projected amounts.
- Name specific assets in your recommendation — do not be vague.
- Your analysis should genuinely help someone decide where to put their money.
- Calculate approximate SIP projections using compound interest formulas.
- Consider Indian tax implications (LTCG, STCG, indexation for debt) where relevant.`;

    try {
        const analysis = await generateJson<AnalysisReport>(prompt);
        return ok(analysis);
    } catch (error) {
        console.error("Analyze API error:", error);
        return fail("UPSTREAM_ERROR", "Failed to generate analysis.", 502);
    }
}
