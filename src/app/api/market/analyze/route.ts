import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * POST /api/market/analyze
 * Deep AI comparative analysis endpoint. Accepts multiple assets with their metrics
 * and produces a comprehensive, actionable investment analysis report.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { assets, sipAmount, years, stepUp } = body;

        if (!assets || !Array.isArray(assets) || assets.length === 0) {
            return NextResponse.json(
                { success: false, message: "At least one asset is required for analysis." },
                { status: 400 }
            );
        }

        const apiKey = env.GOOGLE_AI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { success: false, message: "GOOGLE_AI_API_KEY is not configured." },
                { status: 500 }
            );
        }

        const assetsDescription = assets.map((a: any, idx: number) => {
            const lines = [
                `${idx + 1}. **${a.name}** (${a.symbol}, ${a.type})`,
                `   - 3Y CAGR: ${a.cagr3y}%`,
            ];
            if (a.cagr5y) lines.push(`   - 5Y CAGR: ${a.cagr5y}%`);
            if (a.cagr1y) lines.push(`   - 1Y Return: ${a.cagr1y}%`);
            lines.push(`   - Volatility: ${a.volatility}, Consistency Score: ${a.consistency}/100`);
            lines.push(`   - Max Drawdown: ${a.drawdown}%`);
            lines.push(`   - Sector: ${a.sector}`);
            if (a.peRatio) lines.push(`   - P/E: ${a.peRatio}, P/B: ${a.pbRatio || 'N/A'}, ROE: ${a.roe || 'N/A'}%`);
            if (a.marketCap) lines.push(`   - Market Cap: ${a.marketCap}`);
            if (a.debtToEquity) lines.push(`   - Debt/Equity: ${a.debtToEquity}`);
            if (a.aiSummary) lines.push(`   - Summary: ${a.aiSummary}`);
            return lines.join("\n");
        }).join("\n\n");

        const sipFormatted = (sipAmount || 10000).toLocaleString("en-IN");
        const investmentYears = years || 10;

        const prompt = `You are WealthyMinds AI Teller — a premium, expert-level investment analyst specializing in Indian financial markets and long-term SIP (Systematic Investment Plan) strategies.

## Your Task
Provide a comprehensive, deeply analytical, and actionable comparative analysis for a disciplined Indian retail investor considering a **${investmentYears}-year SIP** with **₹${sipFormatted}/month**${stepUp ? ` and a **${stepUp}% yearly step-up**` : ''}.

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
            console.error("Gemini analyze API error:", errText);
            throw new Error(`Gemini API returned status ${response.status}`);
        }

        const resData = await response.json();
        const aiText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiText) {
            throw new Error("Empty response from Gemini for analysis");
        }

        const analysis = JSON.parse(aiText.trim());

        return NextResponse.json({
            success: true,
            data: analysis,
            source: "gemini",
        });

    } catch (error: any) {
        console.error("Analyze API Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to generate analysis", error: error.message },
            { status: 500 }
        );
    }
}
