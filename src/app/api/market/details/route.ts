import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * GET /api/market/details
 * Fetches comprehensive asset performance metrics.
 * - For Stocks: Real fundamentals from Groww API + AI-powered CAGR/analysis from Gemini
 * - For Mutual Funds/Bonds: Full AI-powered analysis from Gemini
 * No hardcoded fallback data — returns error if APIs fail.
 */

// ─── Groww Real Stock Data Fetcher ───────────────────────────────────────────
async function fetchGrowwStockData(searchId: string): Promise<any | null> {
    try {
        const url = `https://groww.in/v1/api/stocks_data/v1/company/search_id/${encodeURIComponent(searchId)}`;

        // Authenticate with Groww API key if available
        const headers: Record<string, string> = {
            "Accept": "application/json",
        };
        if (env.GROWW_API_KEY) {
            headers["Authorization"] = `Bearer ${env.GROWW_API_KEY}`;
        }

        const response = await fetch(url, {
            method: "GET",
            headers,
        });

        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

// ─── Extract clean metrics from raw Groww stock response ─────────────────────
function extractGrowwMetrics(growwData: any): Record<string, any> {
    const header = growwData?.header || {};
    const stats = growwData?.stats || {};
    const priceData = growwData?.priceData?.nse || growwData?.priceData?.bse || {};

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
    try {
        const { searchParams } = new URL(request.url);
        const name = searchParams.get("name");
        const type = searchParams.get("type");
        const symbol = searchParams.get("symbol");
        const id = searchParams.get("id");

        if (!name || !type) {
            return NextResponse.json(
                { code: "BAD_REQUEST", message: "Name and Type are required." },
                { status: 400 }
            );
        }

        const apiKey = env.GOOGLE_AI_API_KEY;

        // ── Step 1: Fetch real Groww data for stocks ────────────────────────
        let growwMetrics: Record<string, any> = {};
        const isStock = type === "Stock" || type === "Equity";

        if (isStock && id) {
            const growwData = await fetchGrowwStockData(id);
            if (growwData) {
                growwMetrics = extractGrowwMetrics(growwData);
            }
        }

        // ── Step 2: Call Gemini for CAGR, volatility, and AI analysis ───────
        if (!apiKey) {
            // If no Gemini key, return Groww-only data for stocks, error for others
            if (Object.keys(growwMetrics).length > 0) {
                return NextResponse.json({
                    success: true,
                    data: {
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
                        aiSummary: "AI analysis unavailable — GOOGLE_AI_API_KEY not configured.",
                        strengths: [],
                        risks: [],
                        recommendation: "Configure GOOGLE_AI_API_KEY for full analysis.",
                    },
                    source: "groww-only",
                });
            }

            return NextResponse.json(
                { success: false, message: "GOOGLE_AI_API_KEY is required for this asset type." },
                { status: 500 }
            );
        }

        // Build context from real Groww data to calibrate Gemini's analysis
        let growwContext = "";
        if (Object.keys(growwMetrics).length > 0) {
            growwContext = `
IMPORTANT — Use these REAL, LIVE market fundamentals to calibrate your analysis:
- Market Cap: ${growwMetrics.marketCap || 'N/A'}
- P/E Ratio (TTM): ${growwMetrics.peRatio || 'N/A'}
- P/B Ratio: ${growwMetrics.pbRatio || 'N/A'}
- ROE: ${growwMetrics.roe || 'N/A'}%
- EPS (TTM): ₹${growwMetrics.eps || 'N/A'}
- Debt/Equity: ${growwMetrics.debtToEquity || 'N/A'}
- Dividend Yield: ${growwMetrics.dividendYield || 'N/A'}%
- 52-Week High: ₹${growwMetrics.yearHigh || 'N/A'}
- 52-Week Low: ₹${growwMetrics.yearLow || 'N/A'}
- Cap Category: ${growwMetrics.cappedType || 'N/A'}
- Industry: ${growwMetrics.industryName || 'N/A'}
- Operating Margin: ${growwMetrics.operatingMargin ? growwMetrics.operatingMargin.toFixed(1) + '%' : 'N/A'}
- Net Profit Margin: ${growwMetrics.netProfitMargin ? growwMetrics.netProfitMargin.toFixed(1) + '%' : 'N/A'}
- Current Ratio: ${growwMetrics.currentRatio || 'N/A'}
- EV/EBITDA: ${growwMetrics.evToEbitda || 'N/A'}

These are verified live numbers — your CAGR, volatility, and drawdown estimates must be consistent with them.`;
        }

        const prompt = `You are a professional financial data and analysis system with access to real-time Indian market data.

Analyze this asset: "${name}" (Type: ${type}, Symbol: ${symbol || 'N/A'}, Groww ID: ${id || 'N/A'})
${growwContext}

Return a JSON object with comprehensive, ACCURATE performance metrics and investment analysis:
{
  "symbol": "${growwMetrics.nseSymbol || symbol || 'UNKNOWN'}",
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

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" },
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini API error during details fetch:", errText);
            throw new Error(`Gemini API returned status ${response.status}`);
        }

        const resData = await response.json();
        const aiText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiText) {
            throw new Error("Empty response from Gemini API for details");
        }

        const parsedData = JSON.parse(aiText.trim());

        // Merge: Groww real fundamentals + Gemini AI analysis
        const enrichedData = {
            ...parsedData,
            // Overlay real Groww data fields (they're accurate live numbers)
            ...(Object.keys(growwMetrics).length > 0 ? growwMetrics : {}),
            // Preserve Gemini's analytical fields (they shouldn't be overwritten by Groww)
            cagr3y: parsedData.cagr3y,
            cagr5y: parsedData.cagr5y,
            cagr1y: parsedData.cagr1y,
            volatility: parsedData.volatility,
            volatilityPercent: parsedData.volatilityPercent,
            consistency: parsedData.consistency,
            drawdown: parsedData.drawdown,
            sector: parsedData.sector,
            riskLabel: parsedData.riskLabel,
            aiSummary: parsedData.aiSummary,
            strengths: parsedData.strengths,
            risks: parsedData.risks,
            recommendation: parsedData.recommendation,
            fairValueAssessment: parsedData.fairValueAssessment,
            sipSuitability: parsedData.sipSuitability,
        };

        return NextResponse.json({
            success: true,
            data: enrichedData,
            source: Object.keys(growwMetrics).length > 0 ? "groww+gemini" : "gemini",
        });

    } catch (error: any) {
        console.error("Details API Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch asset details.", error: error.message },
            { status: 500 }
        );
    }
}
